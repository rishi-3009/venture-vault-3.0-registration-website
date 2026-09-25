# Project Brief — Venture Vault 3.0 Registration Site

## The problem

E-Cell RBU runs Venture Vault, an entrepreneurship competition. Registration for
3.0 needs to collect full team details from ~125 teams (~500 students) and put
them somewhere the organising committee can read.

A Google Form would do this. The developer chose to build a custom site instead —
partly for the branded experience, partly as a learning project. That choice
carries a risk: a custom site can break in ways a Google Form cannot. Everything
in these docs is written to manage that risk.

**Fallback:** if the site isn't working by 21 September 2026, abandon it and use
a Google Form. That is a legitimate outcome, not a failure.

---

## What the user experiences

A single scrolling page on their phone:

1. **Hero.** The E-Cell RBU logo above "VENTURE VAULT 3.0" in amber, on a plain
   black background. No poster image behind it.
2. **Scroll.** Logo and text break apart together into particles and dissolve
   to black — one motion, not a text-to-logo transformation.
3. **Games.** Three small cards: Reel Marketing, Baggage Battle, Monopoly.
   Title-only, no descriptions. Low visual priority.
4. **Form.** A card showing one group of questions at a time. Tap Next to advance.
   Six steps, then a review, then submit.
5. **Success.** Confirmation text. A WhatsApp group link will go here later.

---

## Decisions already made

Recorded so nobody relitigates them mid-build.

| Question | Decision | Why |
|---|---|---|
| Google Form or custom site? | Custom site | Branded experience + learning goal |
| Framework | Next.js (JavaScript) | Serverless functions + Vercel in one project |
| Backend | Apps Script now, upgradeable to a Google service account later | Fastest path to working, without painting us into a corner |
| Particle animation | Build the full version, with a simplified fallback designed in from day one | Ambitious but with an escape hatch |
| Games | All teams play all three, in fixed order | No game-selection field needed |
| Email domain | Must end `@rbunagpur.in`, and the local part must start `26` | Keeps outsiders out, and the `26` prefix (2026 admission year) restricts registration to first years — this resolves open question #1 below |
| Team size | 1–4, only the leader mandatory | Solo/partial teams register anyway; E-Cell pairs them up into full teams at the event. Backend supports this (see below); the form asks for all 4, but members 2-4 are visibly optional and skipped by simply leaving them blank — no separate "skip" control. |
| Member fields | Leader fills Name, Branch, Email, Phone. Members 2-4 fill only Name + Email. | Members aren't the point of contact, and asking for Branch/Phone from people who might not even end up on this team added friction for no benefit. |
| Duplicates | Blocked by team name, leader email and leader phone (members can repeat across teams) | Prevents double-registration mess |
| Registration cap | None for now | Can be added later |
| Draft saving | Yes, local | College wifi is unreliable |
| Admin panel | No — the Sheet is enough | Scope control |
| Colours | Black + orange/amber | Matches E-Cell branding |
| Hero background | Plain black, no poster | The 2.0 poster is unusable (wrong year, wrong games, departed guests) and baked-in text is illegible on a phone |

---

## The backend decision, explained

The developer chose a hybrid: start simple, keep the upgrade path open.

**How it works.** The browser never talks to Google directly. It posts to
`/api/register`, a serverless function running on Vercel. That function holds the
Apps Script URL in a server-side environment variable and forwards the data.

**Why this matters.** The naive version of Apps Script integration puts the script
URL directly in the frontend JavaScript, where anyone can open devtools, find it,
and POST junk rows into your Sheet all night. Routing through a Next.js API route
keeps that URL server-side — the browser has no idea where the data actually goes.

**The upgrade path.** If you later want the official Google Sheets API with a
service account, you rewrite the inside of `app/api/register/route.js` and change
nothing else. The frontend keeps posting to the same place.

---

## Why the backend already tolerates 1–4 people

Recorded because it answers a question that will come up again: *"if I change a
rule in the form later, does the backend just pick it up automatically?"*

**No — the backend is a separate program.** It never reads the React code. It
only ever sees whatever JSON the frontend happens to POST to `/api/register`.
If a validation rule changes on the form side (say, a field becomes optional),
the backend has no way to know that unless someone updates its rules to match.
`docs/ARCHITECTURE.md` says this outright: *"client validation is a convenience,
not security"* — the server re-checks everything itself, independently, on
purpose. Anyone can skip the form entirely and POST straight to the API route.

**But there's a design choice that makes future changes cheap or expensive:**
whether the backend's data *shape* assumes exactly 4 people, or already
tolerates anywhere from 1–4. Since solo/partial teams were already decided
(see the decisions table above), the backend was built from day one to accept
a leader plus 0–3 members — `member1`/`member2`/`member3` can each be `null`,
duplicate-checks skip whichever ones are missing, and the Sheet just gets a
blank cell for an absent member instead of an empty string. This paid off when
the form's own member-skipping was built: leaving a member step blank (no
dedicated "skip" button needed — see `FORM_SPEC.md`) required **zero backend
changes**, since the shape it produces was already what the backend expected.

**What still isn't automatic:** the actual *rule* — how many people are
required, which fields are mandatory — is a business decision, not something
either side can infer from the other. If that rule changes again later (e.g.
"actually, require at least 2 people"), it has to be updated by hand in two
places that don't know about each other: the form's own validation
(`lib/validation.js`, used client-side) and the API route's re-validation
(`app/api/register/route.js`). Forgetting the second one doesn't break
anything visibly — the form would just silently accept what the server
rejects, or worse, the server would silently accept what the form was
supposed to block.

---

## Scale check

500 registrants over some registration window is small. For context:

- Vercel's free tier allows 100 GB bandwidth and 100 GB-hours of function time a
  month. 125 form submissions will not come close.
- Apps Script web apps allow far more than 125 executions a day.
- A Google Sheet handles 125 rows without noticing.

The scale is not a risk. The animation performance and the deadline are the risks.

---

## Open questions

Resolve these before launch. Ask the developer; don't guess.

1. ~~**Is there a year/semester field?**~~ **Resolved:** no separate field —
   the RBU email's `26` prefix (2026 admission year) already restricts
   registration to first years, so a dedicated year field would be redundant.
2. ~~**What is the official list of RBU branches/programmes?**~~ **Resolved:**
   11 options, confirmed by the developer — see `lib/config.js` and
   `FORM_SPEC.md`.
3. **Post-submission text** is currently a placeholder. Needs real copy.
4. **WhatsApp group link** doesn't exist yet. The success screen has a slot for it
   that stays hidden until a link is added to config.
5. **Who owns the Google account** the Sheet lives in? It should be an E-Cell
   account, not a personal one, so access survives the developer graduating.
6. **Event dates and venue** — not currently shown anywhere on the site. Should
   they be?
7. **Does the E-Cell logo file exist as a transparent PNG/SVG?** Needed for the
   particle target. See `ASSETS.md` for the fallback if not.

---

## Explicitly out of scope

Do not build these unless asked:

- Payment collection
- Email confirmations to registrants
- An admin dashboard
- Edit-after-submit
- Login/accounts
- Multi-language support
- A registration cap or countdown timer
