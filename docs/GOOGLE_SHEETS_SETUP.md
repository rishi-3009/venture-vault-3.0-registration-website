# Google Sheets Setup

This connects the website to a Google Sheet. Free, no credit card, no Google
Cloud Console. About 20 minutes.

---

## How it works

```
Browser → /api/register (your Vercel function) → Apps Script URL → Google Sheet
```

The browser never sees the Apps Script URL. It's stored as an environment
variable on the server. That's what keeps random people from posting junk into
your Sheet.

**Apps Script** is a JavaScript-like language Google lets you run attached to a
Sheet. Deploying it "as a web app" gives you a URL that runs your code when
something POSTs to it.

---

## Step 1 — Create the Sheet

1. Go to https://sheets.google.com and create a blank spreadsheet.
2. Name it **Venture Vault 3.0 — Registrations**.
3. Rename the bottom tab from `Sheet1` to **`Registrations`** (the script looks
   for this exact name).

> Create this in an **E-Cell account**, not a personal one, if possible. Access
> should outlive any one student. If it must be personal for now, add an E-Cell
> account as an Editor immediately.

## Step 2 — Add the header row

In row 1, cells A1 through T1, in this exact order:

```
Timestamp | Submission ID | Team Name |
Leader Name | Leader Branch | Leader Email | Leader Phone |
Member 2 Name | Member 2 Branch | Member 2 Email | Member 2 Phone |
Member 3 Name | Member 3 Branch | Member 3 Email | Member 3 Phone |
Member 4 Name | Member 4 Branch | Member 4 Email | Member 4 Phone
```

Then View → Freeze → 1 row, so headers stay visible while scrolling.

## Step 3 — Open the script editor

**Extensions → Apps Script.** A new tab opens with a file called `Code.gs`
containing an empty `myFunction`. Delete everything in it.

## Step 4 — Paste the script

Ask Claude Code to write this. It must implement all of the following:

**A `doPost(e)` function that:**
1. Takes a lock via `LockService.getScriptLock()` with a ~10 second timeout, and
   releases it in a `finally` block.
2. Parses `e.postData.contents` as JSON.
3. Verifies a shared secret field in the payload against a value stored in
   Script Properties. Reject with an error if it doesn't match.
4. Reads all existing rows once into memory.
5. Runs the duplicate checks from `FORM_SPEC.md` — team name, all emails, all
   phones.
6. If clean, appends one row in the exact column order above, with a timestamp
   and a generated submission ID.
7. Returns JSON: `{ ok: true, submissionId }` or
   `{ ok: false, error: "...", field: "..." }`.

**Why the lock matters.** Two teams submitting at the same instant could both
read the Sheet, both see no duplicate, and both write. The lock forces them into
a queue. With 125 teams it's unlikely — but it's three lines of code and the
failure mode is silent corruption.

**Why the shared secret.** Even though the URL is server-side, if it ever leaks
the secret is a second barrier. Generate a long random string, store it in Apps
Script under Project Settings → Script Properties, and put the same value in
Vercel as `APPS_SCRIPT_SECRET`.

## Step 5 — Deploy as a web app

1. Click **Deploy → New deployment**.
2. Click the gear next to "Select type" → choose **Web app**.
3. Fill in:
   - Description: `VV3 registration endpoint v1`
   - Execute as: **Me (your@email)**
   - Who has access: **Anyone**
4. Click **Deploy**.
5. Google asks for authorisation. Click Review Permissions → pick your account →
   you'll see **"Google hasn't verified this app."** Click **Advanced** → **Go to
   (project name) (unsafe)** → **Allow**.

   That warning is expected. It appears for every unverified personal script.
   You're granting your own script access to your own Sheet.

6. Copy the **Web app URL**. It looks like
   `https://script.google.com/macros/s/AKfycb.../exec`.

> **"Who has access: Anyone"** sounds alarming but is required — Vercel's servers
> aren't logged into your Google account. The shared secret is what actually
> protects the endpoint.

## Step 6 — Wire it into the site

In `.env.local`:

```
APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycb.../exec
APPS_SCRIPT_SECRET=your-long-random-string-here
```

Restart the dev server. Add the same two variables in Vercel later — see
`DEPLOY_VERCEL.md`.

## Step 7 — Test

Submit a team with team name `TEST-001` and obviously fake details. Check:

- [ ] A row appears in the Sheet with every column correct
- [ ] Submitting `TEST-001` again is rejected for duplicate team name
- [ ] A different team name reusing one of those emails is rejected
- [ ] Same for a reused phone number
- [ ] The success screen shows

Delete test rows before launch.

---

## Re-deploying after script edits

**Editing the script does not update the live web app.** You must
**Deploy → Manage deployments → pencil icon → Version: New version → Deploy.**

This trips up everyone the first time. If your changes seem to have no effect,
this is why.

---

## Sharing the Sheet

**Share → General access → Anyone with the link → Viewer**, then copy the link
for the organising team.

Give **Editor** access only to people who need it. A viewer link can't be used to
delete 125 registrations by accident.

---

## Limits (you will not hit these)

| Limit | Free tier | You need |
|---|---|---|
| Script runtime per execution | 6 min | < 2 sec |
| Executions per day | 20,000 | ~125 |
| URL fetch calls per day | 20,000 | 0 |
| Sheet cells | 10 million | ~2,600 |

---

## Upgrading later (optional)

If you ever want the official Sheets API instead:

1. Create a Google Cloud project, enable the Sheets API
2. Create a service account, download its JSON key
3. Share the Sheet with the service account's email address
4. Put the key in Vercel as an environment variable
5. Rewrite `app/api/register/route.js` to call the Sheets API directly

The frontend doesn't change at all. That's the whole point of routing through
your own API route.
