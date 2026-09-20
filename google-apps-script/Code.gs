/**
 * Venture Vault 3.0 — registration endpoint.
 *
 * This file is NOT part of the Next.js app and Vercel never sees it. It lives
 * here only so it's version-controlled somewhere. The actual code that runs
 * is whatever you paste into the Sheet's Extensions → Apps Script editor —
 * see docs/GOOGLE_SHEETS_SETUP.md for the full walkthrough (creating the
 * Sheet, deploying this as a web app, re-deploying after edits, etc).
 *
 * Column order in row 1 of the "Registrations" tab (A–T):
 *   Timestamp | Submission ID | Team Name |
 *   Leader Name | Leader Branch | Leader Email | Leader Phone |
 *   Member 2 Name | Member 2 Branch | Member 2 Email | Member 2 Phone |
 *   Member 3 Name | Member 3 Branch | Member 3 Email | Member 3 Phone |
 *   Member 4 Name | Member 4 Branch | Member 4 Email | Member 4 Phone
 *
 * A team can be as small as just a leader — member1/2/3 arrive as `null`
 * when that slot isn't part of the team, and get written as blank cells
 * (see docs/PROJECT_BRIEF.md: solo/partial teams are paired up at the event).
 */

var SHEET_NAME = "Registrations";

// 0-indexed column positions for the four possible people, used by the
// duplicate scan below. Team Name is column index 2.
var TEAM_NAME_COL = 2;
var PEOPLE_COLUMNS = [
  { key: "leader", name: 3, branch: 4, email: 5, phone: 6 },
  { key: "member1", name: 7, branch: 8, email: 9, phone: 10 },
  { key: "member2", name: 11, branch: 12, email: 13, phone: 14 },
  { key: "member3", name: 15, branch: 16, email: 17, phone: 18 },
];

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
  var emailCols = PEOPLE_COLUMNS.map(function (p) { return p.email; });
  var phoneCols = PEOPLE_COLUMNS.map(function (p) { return p.phone; });

  for (var i = 0; i < PEOPLE_COLUMNS.length; i++) {
    var personKey = PEOPLE_COLUMNS[i].key;
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

  // Clean — append the row. Missing members become blank cells.
  var submissionId = Utilities.getUuid();
  var row = [new Date(), submissionId, teamName];

  PEOPLE_COLUMNS.forEach(function (col) {
    var person = data[col.key];
    row.push(person ? person.name : "");
    row.push(person ? person.branch : "");
    row.push(person ? person.email : "");
    row.push(person ? person.phone : "");
  });

  sheet.appendRow(row);

  return { ok: true, submissionId: submissionId };
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
