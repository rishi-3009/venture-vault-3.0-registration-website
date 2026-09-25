/**
 * Venture Vault 3.0 — registration endpoint.
 *
 * This file is NOT part of the Next.js app and Vercel never sees it. It lives
 * here only so it's version-controlled somewhere. The actual code that runs
 * is whatever you paste into the Sheet's Extensions → Apps Script editor —
 * see docs/GOOGLE_SHEETS_SETUP.md for the full walkthrough (creating the
 * Sheet, deploying this as a web app, re-deploying after edits, etc).
 *
 * Column order in row 1 of the "Registrations" tab (A–N):
 *   Timestamp | Team ID | Team Name |
 *   Leader Name | Leader Branch | Leader Email | Leader Phone |
 *   Member 2 Name | Member 2 Email |
 *   Member 3 Name | Member 3 Email |
 *   Member 4 Name | Member 4 Email |
 *   Submission ID
 *
 * Submission ID (column N) isn't for organisers to read — it's an internal
 * fingerprint the frontend generates once per registration attempt, used
 * only to detect a retried submission (see handleSubmission below). Safe to
 * ignore, hide, or leave the column collapsed.
 *
 * A team can be as small as just a leader — member1/2/3 arrive as `null`
 * when that slot isn't part of the team, and get written as blank cells
 * (see docs/PROJECT_BRIEF.md: solo/partial teams are paired up at the event).
 * Only the leader has Branch/Phone columns — members 2-4 only ever provide
 * Name + Email (see docs/FORM_SPEC.md), so there's no column for them to
 * leave blank in the first place.
 */

var SHEET_NAME = "Registrations";

// 0-indexed column positions, used by the duplicate scan and row-building
// below. Team Name is column index 2.
var TEAM_NAME_COL = 2;
var LEADER_COLUMNS = { key: "leader", name: 3, branch: 4, email: 5, phone: 6 };
var MEMBER_COLUMNS = [
  { key: "member1", name: 7, email: 8 },
  { key: "member2", name: 9, email: 10 },
  { key: "member3", name: 11, email: 12 },
];
var SUBMISSION_ID_COL = 13;

function doPost(e) {
  var lock = LockService.getScriptLock();
  var response;

  try {
    lock.waitLock(10000);
  } catch (lockError) {
    return respond({ ok: false, error: "Server is busy, please try again in a moment." });
  }

  try {
    response = handleSubmission(e);
  } catch (err) {
    response = { ok: false, error: "Unexpected server error: " + err.message };
  } finally {
    lock.releaseLock();
  }

  return respond(response);
}

function handleSubmission(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return { ok: false, error: "Malformed request." };
  }

  var expectedSecret = PropertiesService.getScriptProperties().getProperty("APPS_SCRIPT_SECRET");
  if (!expectedSecret || data.secret !== expectedSecret) {
    return { ok: false, error: "Unauthorized." };
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    return { ok: false, error: "Registrations sheet not found." };
  }

  var rows = sheet.getDataRange().getValues();
  rows.shift(); // header row

  var teamName = (data.teamName || "").trim();
  var teamNameLower = teamName.toLowerCase();
  var submissionId = (data.submissionId || "").trim();

  // 1. Team name, against every existing row.
  for (var r = 0; r < rows.length; r++) {
    if (String(rows[r][TEAM_NAME_COL]).trim().toLowerCase() === teamNameLower) {
      // Before treating this as a genuine clash: is it actually the same
      // submission attempt landing twice (e.g. the first attempt's response
      // got lost on a flaky connection, and the user just retried)? The
      // frontend sends the same submissionId on every retry of one attempt,
      // so a match here means "you already registered, here's your original
      // Team ID" rather than "someone else has this name."
      if (submissionId && String(rows[r][SUBMISSION_ID_COL]).trim() === submissionId) {
        return { ok: true, teamId: rows[r][1] };
      }
      return {
        ok: false,
        error: 'A team called "' + teamName + '" has already registered. Please pick a different name.',
        field: "teamName",
      };
    }
  }

  // 2. Leader email and phone, against the leader columns of every existing
  // row. Member emails are deliberately NOT checked across teams — a member
  // can appear on more than one team, and E-Cell sorts that out at the event
  // (see CLAUDE.md requirement 7). `personKey` tells the frontend to show the
  // error next to the leader's fields.
  var leader = data.leader || {};
  var leaderEmail = (leader.email || "").trim().toLowerCase();
  var leaderPhone = (leader.phone || "").trim();

  for (var r2 = 0; r2 < rows.length; r2++) {
    if (leaderEmail && String(rows[r2][LEADER_COLUMNS.email]).trim().toLowerCase() === leaderEmail) {
      return {
        ok: false,
        error:
          'This email is already registered as the leader of team "' +
          rows[r2][TEAM_NAME_COL] +
          '". Each person can only lead one team.',
        field: "email",
        personKey: LEADER_COLUMNS.key,
      };
    }
    if (leaderPhone && String(rows[r2][LEADER_COLUMNS.phone]).trim() === leaderPhone) {
      return {
        ok: false,
        error: 'This number is already registered with team "' + rows[r2][TEAM_NAME_COL] + '".',
        field: "phone",
        personKey: LEADER_COLUMNS.key,
      };
    }
  }

  // Clean — append the row. Missing members become blank cells. Team ID is
  // just "how many teams came before this one, plus one" — sequential and
  // human-readable, so anyone can Ctrl+F it straight in the Sheet. Safe from
  // collisions because doPost holds the script lock for the whole request,
  // so no two submissions ever compute this at the same time.
  var teamId = rows.length + 1;
  var row = [new Date(), teamId, teamName];

  row.push(leader.name || "");
  row.push(leader.branch || "");
  row.push(leader.email || "");
  row.push(leader.phone || "");

  MEMBER_COLUMNS.forEach(function (col) {
    var person = data[col.key];
    row.push(person ? person.name : "");
    row.push(person ? person.email : "");
  });

  row.push(submissionId);

  sheet.appendRow(row);

  return { ok: true, teamId: teamId };
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
