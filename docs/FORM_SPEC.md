# Form Specification

The authoritative definition of every field, rule, and message. If code and this
doc disagree, this doc is right.

---

## Step 0 — Team Name

**Heading:** Let's start with your team
**Field:** Team Name — single line text

| Rule | Value |
|---|---|
| Required | Yes |
| Min length | 2 characters after trimming |
| Max length | 40 characters |
| Allowed | Letters, numbers, spaces, hyphens, apostrophes |
| Normalisation | Trim; collapse repeated spaces to one |
| Uniqueness | Case-insensitive, checked server-side |

Errors:
- Empty → `Team name is required.`
- Too short → `Team name must be at least 2 characters.`
- Too long → `Team name must be 40 characters or fewer.`
- Bad characters → `Team name can only use letters, numbers, spaces and hyphens.`
- Duplicate (server) → `A team called "X" has already registered. Please pick a different name.`

Helper text: *Teams can have up to 4 people. Only the leader is required — members 2-4 are optional.*

---

## Steps 1–4 — People

The leader (step 1) fills all four fields below. Members 2-4 only fill
**Full Name** and **RBU Email** — no Branch/Programme, no Phone. They're
optional: a team can be just a leader, and E-Cell pairs solo/partial teams
up at the event (see `PROJECT_BRIEF.md`).

There's no explicit "skip this member" button — a member step is simply left
blank to skip it. It only needs to validate if it was touched (see "Skipping
a member," below).

| Step | Heading | Sub-heading | Fields shown |
|---|---|---|---|
| 1 | Team Leader | This is who we'll contact about the event | Name, Branch, Email, Phone |
| 2 | Member 2 (Optional) | | Name, Email |
| 3 | Member 3 (Optional) | | Name, Email |
| 4 | Member 4 (Optional) | | Name, Email |

> Note the labelling: the leader is member 1 of 4. Calling the next three
> "Member 1/2/3" reads as a fifth and sixth person. Use "Member 2, 3, 4."

### Skipping a member

A member step counts as "being added" the moment either Name or Email has
something in it. If both are empty, Next just advances — that member simply
isn't part of the team. If only one of the two has something, both are then
required (so a half-typed name with no email can't slip through as a silent
skip).

### Field: Full Name

| Rule | Value |
|---|---|
| Required | Yes |
| Min / Max | 2 / 50 characters after trimming |
| Allowed | Letters, spaces, hyphens, apostrophes, periods |
| Input hints | `autocomplete="name"`, `autocapitalize="words"` |

- Empty → `Name is required.`
- Too short → `Please enter a full name.`
- Digits present → `Name can't contain numbers.`

### Field: Branch / Programme

**Leader only** — members 2-4 don't have this field.

A **dropdown**, not free text. Free text produces "CSE", "cse", "Comp Sci",
"Computer Science Engg" in the same column and makes the Sheet painful to sort.

Confirmed list (see `lib/config.js`):

```
Computer Science & Engineering
Computer Science & Engineering (SAP)
BCA
Electrical Engineering
Electronics & Computer Science
Electronics & Communication Engineering
Robotics & Artificial Intelligence
Civil Engineering
Mechanical Engineering
BBA
Other
```

Selecting **Other** reveals a text input (required, 2–50 chars).

- Nothing selected → `Please select a branch.`
- Other chosen, box empty → `Please type your branch.`

### Field: RBU Email

| Rule | Value |
|---|---|
| Required | Yes |
| Format | Valid email shape |
| Domain | Must end `@rbunagpur.in` (case-insensitive) |
| Prefix | Must start with `26` — encodes the 2026 admission year, so this is what restricts registration to first years |
| Normalisation | Trim, lowercase before storing |
| Input hints | `type="email"`, `inputmode="email"`, `autocapitalize="off"`, `autocorrect="off"` |
| Uniqueness | Server-side, across every email in the Sheet |

- Empty → `Email is required.`
- Malformed → `That doesn't look like a valid email address.`
- Wrong domain → `Please use your RBU email address (ending in @rbunagpur.in).`
- Wrong prefix → `Please use your RBU email address (starts with 26, e.g. 26xxxxxxx@rbunagpur.in).`
- Duplicate → `This email is already registered with team "X". Each person can only be in one team.`
- Duplicate within this form → `This email is already used by another member of your team.`

> `autocapitalize="off"` matters. Mobile keyboards capitalise the first letter by
> default, and `Harshavi@rbunagpur.in` will confuse people when it fails to match.
> Lowercasing on save handles it, but turning the keyboard behaviour off is cleaner.

### Field: Phone Number

**Leader only** — members 2-4 don't have this field.

| Rule | Value |
|---|---|
| Required | Yes |
| Length | Exactly 10 digits |
| First digit | 6, 7, 8 or 9 (valid Indian mobile range) |
| Normalisation | Strip spaces, hyphens, `+91`, leading `0` before validating |
| Input hints | `type="tel"`, `inputmode="numeric"`, `maxlength="10"` |
| Uniqueness | Server-side, across all phone numbers |

- Empty → `Phone number is required.`
- Wrong length → `Phone number must be exactly 10 digits.`
- Bad first digit → `Please enter a valid Indian mobile number.`
- Duplicate → `This number is already registered with team "X".`
- Duplicate within this form → `This number is already used by another member of your team.`

> Strip `+91` and leading zeros before validating rather than rejecting them.
> People type their number the way they always do; silently accepting
> `+91 98765 43210` is better than an error for a number that's perfectly fine.

---

## Step 5 — Review

Show everything entered, grouped by person, read-only. Each group gets an **Edit**
link that jumps back to that step and returns to review on Next. A member that
was left blank (no name, no email) still shows its group — Name/Email just
read **NIL** rather than being hidden. Members never show Branch/Phone rows at
all, since those fields don't exist for them (leader only).

A final line: *Please check carefully — you won't be able to edit after submitting.*

Then the **Submit Registration** button.

While submitting: disable the button, show a spinner and "Submitting…". Guard
against double-taps — a laggy connection makes people tap twice, and two taps
must not produce two rows.

---

## Step 6 — Success

Currently a placeholder; real copy pending.

```
🎉 You're registered!

Team "<TEAM NAME>" is confirmed for Venture Vault 3.0.

Your Team ID: <TEAM ID> — remember this.

[WhatsApp block — hidden until a link exists in config]
Join the participants' group for updates:
[ Join WhatsApp Group ]
```

Team ID is whatever number the Apps Script returned for this submission (see
`GOOGLE_SHEETS_SETUP.md`) — the same number that's in column B of the Sheet, so
it's how organisers find this team fast. Nothing shows if the submission
response didn't include one.

The WhatsApp block reads `WHATSAPP_INVITE_LINK` from `lib/config.js`. If it's an
empty string the whole block doesn't render. Adding the link later is a one-line
change.

Clear the saved draft on reaching this screen.

---

## Duplicate detection — the exact rules

Checked server-side on submit, against the whole Sheet. Any hit rejects the
entire submission; nothing partial gets written.

1. **Team name** — case-insensitive, whitespace-collapsed match against any
   existing team name.
2. **Email** — normalised lowercase match against every email column of every row,
   for whichever of the 4 people were actually submitted.
3. **Phone** — normalised 10-digit match against the phone column of every row.
   Only the leader has a phone, so this only ever runs on the leader's number.
4. **Within-team** — every submitted email must differ from every other submitted
   email, same for phone. A blank phone (any member) never counts as a clash
   with another blank phone. Check this client-side too, at the review step,
   since it needs no server round-trip.

Error messages name the specific clash. "Duplicate entry found" tells the user
nothing and generates a WhatsApp message to the organisers.

---

## Mobile input details

Small things that decide whether this feels good or awful on a phone:

- **Touch targets ≥ 44px tall.** Inputs and buttons both.
- **Font size ≥ 16px on inputs.** Below 16px, iOS Safari zooms in on focus and
  the layout jumps. This is the single most common mobile form bug.
- **Next button reachable with a thumb** — bottom of the card, not the top.
- **Autofocus the first field of each step**, but *not* on step 0 on load — an
  instant keyboard on page load before they've read anything is jarring.
- **Correct keyboard per field:** email keyboard for email, number pad for phone.
- **Errors appear below the field**, in red, with an icon — colour alone isn't
  enough for colour-blind users.
- **Scroll to the first error** when Next is tapped and validation fails.

---

## Draft saving

- Key: `vv3_registration_draft`
- Save the whole `formData` object plus `currentStep` on every change, debounced
  ~300ms so you're not writing on every keystroke.
- On load: if a draft exists, restore it and show a small dismissible note —
  *We saved your progress. Continue where you left off?*
- Clear on successful submission.
- Wrap every localStorage call in try/catch. Private browsing modes throw, and an
  unhandled throw here would take the whole form down.
