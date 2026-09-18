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

1. **Hero.** "VENTURE VAULT 3.0" in amber on a plain black background. No poster
   image behind it.
2. **Scroll.** The text shatters into particles.
3. **Scroll.** Particles regather into the E-Cell RBU logo.
4. **Scroll.** Logo fades out.
5. **Games.** Three small cards: Reel Marketing, Baggage Battle, Monopoly.
   Title-only, no descriptions. Low visual priority.
6. **Form.** A card showing one group of questions at a time. Tap Next to advance.
   Six steps, then a review, then submit.
7. **Success.** Confirmation text. A WhatsApp group link will go here later.

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
| Email domain | Must end `@rbunagpur.in` | Keeps outsiders out |
| Team size | Exactly 4, all mandatory | No partial teams |
| Duplicates | Blocked, by team name and by person | Prevents double-registration mess |
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

1. **Is there a year/semester field?** The 2.0 poster said "exclusively for 1st
   years." If 3.0 has the same restriction, the form needs a year field and a
   validation rule. Currently not built.
2. **What is the official list of RBU branches/programmes?** `FORM_SPEC.md` has a
   draft list that **must be verified** against the official one before launch.
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
