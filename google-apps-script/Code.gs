/**
 * Venture Vault 3.0 — registration endpoint.
 *
 * This file is NOT part of the Next.js app and Vercel never sees it. It lives
 * here only so it's version-controlled somewhere. The actual code that runs
 * is whatever you paste into the Sheet's Extensions → Apps Script editor —
 * see docs/GOOGLE_SHEETS_SETUP.md for the full walkthrough (creating the
 * Sheet, deploying this as a web app, re-deploying after edits, etc).
 *
 * Column order in row 1 of the "Registrations" tab (A–M):
 *   Timestamp | Team ID | Team Name |
 *   Leader Name | Leader Branch | Leader Email | Leader Phone |
 *   Member 2 Name | Member 2 Email |
 *   Member 3 Name | Member 3 Email |
 *   Member 4 Name | Member 4 Email
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
var ALL_PEOPLE_KEYS = [LEADER_COLUMNS.key].concat(
  MEMBER_COLUMNS.map(function (m) { return m.key; })
);

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

  // 1. Team name, against every existing row.
  for (var r = 0; r < rows.length; r++) {
    if (String(rows[r][TEAM_NAME_COL]).trim().toLowerCase() === teamNameLower) {
      return {
        ok: false,
        error: 'A team called "' + teamName + '" has already registered. Please pick a different name.',
        field: "teamName",
      };
    }
  }

  // 2. Email and phone, for each person actually submitted, against every
  // email/phone column of every existing row. `personKey` in the response
  // is one of our own submitted slots (leader/member1/2/3) — the thing the
  // frontend needs in order to show the error next to the right person,
  // regardless of which column of someone else's row it matched.
  var emailCols = [LEADER_COLUMNS.email].concat(
    MEMBER_COLUMNS.map(function (m) { return m.email; })
  );
  var phoneCols = [LEADER_COLUMNS.phone]; // only the leader has a phone column

  for (var i = 0; i < ALL_PEOPLE_KEYS.length; i++) {
    var personKey = ALL_PEOPLE_KEYS[i];
    var person = data[personKey];
    if (!person) continue; // slot not part of this team

    var email = (person.email || "").trim().toLowerCase();
    var phone = (person.phone || "").trim();

    for (var r2 = 0; r2 < rows.length; r2++) {
      for (var c = 0; c < emailCols.length; c++) {
        if (email && String(rows[r2][emailCols[c]]).trim().toLowerCase() === email) {
          return {
            ok: false,
            error:
              'This email is already registered with team "' +
              rows[r2][TEAM_NAME_COL] +
              '". Each person can only be in one team.',
            field: "email",
            personKey: personKey,
          };
        }
      }
      for (var p = 0; p < phoneCols.length; p++) {
        if (phone && String(rows[r2][phoneCols[p]]).trim() === phone) {
          return {
            ok: false,
            error: 'This number is already registered with team "' + rows[r2][TEAM_NAME_COL] + '".',
            field: "phone",
            personKey: personKey,
          };
        }
      }
    }
  }

  // Clean — append the row. Missing members become blank cells. Team ID is
  // just "how many teams came before this one, plus one" — sequential and
  // human-readable, so anyone can Ctrl+F it straight in the Sheet. Safe from
  // collisions because doPost holds the script lock for the whole request,
  // so no two submissions ever compute this at the same time.
  var teamId = rows.length + 1;
  var row = [new Date(), teamId, teamName];

  var leader = data.leader;
  row.push(leader ? leader.name : "");
  row.push(leader ? leader.branch : "");
  row.push(leader ? leader.email : "");
  row.push(leader ? leader.phone : "");

  MEMBER_COLUMNS.forEach(function (col) {
    var person = data[col.key];
    row.push(person ? person.name : "");
    row.push(person ? person.email : "");
  });

  sheet.appendRow(row);

  // Force the Timestamp column to dd/mm/yyyy regardless of the Sheet's own
  // locale setting — otherwise a US-locale Sheet shows 9/21/26 (month first),
  // which reads as a different date entirely to anyone expecting the Indian
  // day-first format.
  sheet.getRange(sheet.getLastRow(), 1).setNumberFormat("dd/mm/yyyy hh:mm:ss");

  return { ok: true, teamId: teamId };
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
