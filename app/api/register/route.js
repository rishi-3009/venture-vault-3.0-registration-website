import {
  validateTeamName,
  normalizeTeamName,
  validatePerson,
  validateMember,
  isMemberFilled,
  normalizeEmail,
  normalizePhone,
} from "@/lib/validation";

// Resolves "Other" + branchOther down to a single branch string, and
// normalises email/phone the same way lib/validation.js's normalizers do —
// so both the duplicate check below and the row written to the Sheet use
// the same clean values, instead of raw client input.
function normalizePersonForStorage(person) {
  if (!person) return null;
  const branch = person.branch === "Other" ? (person.branchOther || "").trim() : person.branch;
  return {
    name: (person.name || "").trim().replace(/\s+/g, " "),
    branch,
    email: normalizeEmail(person.email),
    phone: normalizePhone(person.phone),
  };
}

const MEMBER_KEYS = ["member1", "member2", "member3"];

// The client's own validation (lib/validation.js, same functions) is a
// convenience for instant feedback. This is the copy that actually matters —
// see docs/ARCHITECTURE.md: "client validation is a convenience, not
// security." Anyone can open devtools and POST here directly, skipping the
// form entirely, so nothing from the client is trusted without re-checking.
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }

  const teamNameError = validateTeamName(body.teamName);
  if (teamNameError) {
    return Response.json(
      { ok: false, error: teamNameError, field: "teamName" },
      { status: 400 }
    );
  }

  const leaderErrors = validatePerson(body.leader || {});
  if (Object.keys(leaderErrors).length > 0) {
    return Response.json(
      {
        ok: false,
        error: "The team leader's details need fixing.",
        fieldErrors: { leader: leaderErrors },
      },
      { status: 400 }
    );
  }

  // Validate whichever of member1/2/3 were actually filled in; leave the
  // rest as null so the Sheet gets a blank cell instead of empty strings
  // scattered through the row. Members only ever provide name + email — no
  // branch, no phone (see docs/FORM_SPEC.md) — so they're checked with
  // validateMember, not the leader's validatePerson.
  const members = {};
  for (const key of MEMBER_KEYS) {
    const person = body[key];
    if (isMemberFilled(person)) {
      const personErrors = validateMember(person);
      if (Object.keys(personErrors).length > 0) {
        return Response.json(
          {
            ok: false,
            error: "One of your team members' details needs fixing.",
            fieldErrors: { [key]: personErrors },
          },
          { status: 400 }
        );
      }
      members[key] = person;
    } else {
      members[key] = null;
    }
  }

  const normalizedLeader = normalizePersonForStorage(body.leader);
  const normalizedMembers = {
    member1: normalizePersonForStorage(members.member1),
    member2: normalizePersonForStorage(members.member2),
    member3: normalizePersonForStorage(members.member3),
  };

  // Within-team duplicate check — mirrors lib/validation.js's
  // validateWithinTeamDuplicates, but only over the people actually present.
  const people = [
    normalizedLeader,
    normalizedMembers.member1,
    normalizedMembers.member2,
    normalizedMembers.member3,
  ].filter(Boolean);
  // Guarded on truthy values: members don't submit a phone at all, so two
  // members both having a blank phone must NOT count as a "duplicate" phone.
  const emailSeen = new Set();
  const phoneSeen = new Set();
  for (const person of people) {
    if (person.email && emailSeen.has(person.email)) {
      return Response.json(
        { ok: false, error: "The same email is used by two people on this team." },
        { status: 400 }
      );
    }
    if (person.phone && phoneSeen.has(person.phone)) {
      return Response.json(
        { ok: false, error: "The same phone number is used by two people on this team." },
        { status: 400 }
      );
    }
    if (person.email) emailSeen.add(person.email);
    if (person.phone) phoneSeen.add(person.phone);
  }

  const scriptUrl = process.env.APPS_SCRIPT_URL;
  const secret = process.env.APPS_SCRIPT_SECRET;
  if (!scriptUrl || !secret) {
    // Missing config, not a bad request — don't blame the user for this one.
    console.error("register route: APPS_SCRIPT_URL or APPS_SCRIPT_SECRET is not set.");
    return Response.json(
      { ok: false, error: "Registration is temporarily unavailable. Please try again shortly." },
      { status: 500 }
    );
  }

  // Passed straight through to Apps Script so it can tell "this exact
  // attempt already succeeded, the response just got lost" apart from a
  // genuinely different team reusing the same name. See
  // docs/GOOGLE_SHEETS_SETUP.md.
  const submissionId = typeof body.submissionId === "string" ? body.submissionId.trim() : "";

  const payload = {
    secret,
    submissionId,
    teamName: normalizeTeamName(body.teamName),
    leader: normalizedLeader,
    member1: normalizedMembers.member1,
    member2: normalizedMembers.member2,
    member3: normalizedMembers.member3,
  };

  let scriptResponse;
  try {
    scriptResponse = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("register route: fetch to Apps Script failed:", err);
    return Response.json(
      {
        ok: false,
        error: "Couldn't reach the registration sheet. Check your connection and try again.",
      },
      { status: 502 }
    );
  }

  let result;
  try {
    result = await scriptResponse.json();
  } catch (err) {
    console.error("register route: Apps Script returned non-JSON:", err);
    return Response.json(
      { ok: false, error: "Registration server returned something unexpected. Please try again." },
      { status: 502 }
    );
  }

  // Apps Script itself decides ok/false (e.g. a duplicate found against the
  // whole Sheet) — pass its verdict straight through.
  return Response.json(result, { status: result.ok ? 200 : 409 });
}
