# CLAUDE.md — Venture Vault 3.0 Registration Site

This file is read automatically by Claude Code at the start of every session.
Read it fully before doing anything.

---

## What this project is

A single-page, mobile-first registration website for **Venture Vault 3.0**, an
entrepreneurship event run by **E-Cell RBU** (Ramdeobaba University, Nagpur).

Teams of up to 4 register through a multi-step form. Submissions land in a
Google Sheet. Roughly **500 registrants (~125 teams)** expected.

**Hard deadline: 21 September 2026.** If the site is not deployed and tested by
then, the fallback is a plain Google Form. Protect the deadline over polish.

---

## Who you are working with

The developer is a **second-year CS student and a complete beginner at building
software**. This shapes how you must behave:

- **Explain before you write.** Say what you're about to do and why, in plain
  language, before writing a chunk of code.
- **Do not assume knowledge** of git, the terminal, npm, environment variables,
  deployment, or any standard dev workflow. Spell out commands and say what
  each one does.
- **Ask a clarifying question** rather than guessing on anything ambiguous.
- **One step at a time.** Do not dump ten files at once and say "done." Build a
  piece, explain it, let them run it and see it work, then move on.
- When something breaks, explain *why* it broke, not just the fix.

---

## Non-negotiable requirements

These were decided by the developer. Do not change them without asking.

| # | Requirement |
|---|---|
| 1 | **₹0 total cost.** No paid services, no trials that expire into charges. |
| 2 | **Mobile-first.** Registration happens almost entirely on phones. Design at 390px wide first, scale up second. |
| 3 | Data must land in a **Google Sheet** accessible by link. |
| 4 | Teams need a **leader** (mandatory); up to 3 more members are **optional** — a team can be as small as one person. Solo/partial teams get paired up by E-Cell at the event itself. The backend (`app/api/register/route.js`, `google-apps-script/Code.gs`) already supports 1–4 people; the form's UI still asks for all 4 today — the "skip this member" step is pending. See `docs/PROJECT_BRIEF.md` → "Why the backend already tolerates 1–4 people." |
| 5 | Emails must end in **`@rbunagpur.in`**. |
| 6 | Phone numbers: **exactly 10 digits**, Indian format. |
| 7 | **No duplicates** — not a repeated team name, and not the same person on two teams. |
| 8 | Form is **one question-group per screen** with Next/Back, not a long scroll. |
| 9 | Answers must **survive a page refresh** (draft saved locally). |
| 10 | No registration cap or deadline cutoff for now. |

---

## Stack

- **Next.js** (App Router) with **JavaScript** — not TypeScript. TypeScript adds
  a layer of error messages a beginner doesn't need right now.
- **Tailwind CSS** for styling.
- **No animation libraries.** The particle effect is hand-written on a `<canvas>`.
  Adding Framer Motion / GSAP is more dependency weight than this needs.
- **Google Apps Script** as the data layer (Phase 1), behind a Next.js API route
  so it can be swapped later without touching the frontend.
- **Vercel** for hosting.

Keep the dependency list as close to `next`, `react`, `react-dom`, `tailwindcss`
as possible. Every extra package is another thing that can break at 2am on the
20th.

---

## Read these before building

Read the doc relevant to what you're working on. Don't work from memory of this
file alone.

| Doc | When to read it |
|---|---|
| `docs/PROJECT_BRIEF.md` | Always — full context and open questions |
| `docs/BUILD_PLAN.md` | **Start here.** Ordered tasks, do them in order |
| `docs/SETUP.md` | First-time project setup |
| `docs/ARCHITECTURE.md` | Before creating files or wiring data flow |
| `docs/FORM_SPEC.md` | Any form work — fields, validation, errors |
| `docs/GOOGLE_SHEETS_SETUP.md` | Backend / Apps Script work |
| `docs/DESIGN_SYSTEM.md` | Any styling work |
| `docs/ANIMATION_SPEC.md` | The hero scroll sequence |
| `docs/ASSETS.md` | Images, logo, fonts |
| `docs/DEPLOY_VERCEL.md` | Going live |
| `docs/TESTING.md` | Before sending the link to anyone |

---

## Rules while building

1. **Build order is not negotiable.** Form + backend first, animation last. The
   animation is the nice-to-have; the form is the product. See `BUILD_PLAN.md`.
2. **Never commit secrets.** The Apps Script URL goes in `.env.local`, which is
   gitignored. Never paste it into a component.
3. **Test on a real phone**, not just a narrowed browser window. Browser devtools
   lie about scroll behaviour and performance.
4. **The form must work with the animation completely disabled.** If the canvas
   throws, the page below it must still render and submit.
5. **No fake data in the Sheet.** Use an obvious prefix like `TEST-` for test
   rows so they're easy to delete before launch.
6. When you finish a task in `BUILD_PLAN.md`, tick it off in that file.

---

## Event details

- **Event:** Venture Vault 3.0
- **Organiser:** E-Cell RBU, Ramdeobaba University, Nagpur
- **Games (all teams play all three, in this order):**
  1. Reel Marketing
  2. Baggage Battle
  3. Monopoly
- **Brand:** black background, orange/amber accents

The event name lives in `lib/config.js` as a single constant. Confirmed as
**3.0**.

**Hero:** plain black background with "Venture Vault 3.0" in amber. No poster
image, no background photograph. Keep it simple.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
