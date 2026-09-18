# Build Plan

**Read this before starting. Do the phases in order.**

Deadline: **21 September 2026**. Today: 17 September. That's four days.

---

## The governing principle

**Build the boring, essential thing first. Build the impressive thing last.**

The instinct is to start with the particle animation, because it's the fun part.
Resist it. If you spend two days on particles and the form isn't finished, you
have nothing. If you finish the form on day one and never build the particles,
you have a working registration site.

At every point from the end of Phase 3 onward, you should have something you
could ship.

---

## Phase 1 — Skeleton (target: day 1 morning)

Get something on screen and deployed. No styling, no animation.

- [ ] Run through `SETUP.md` completely
- [ ] Project runs locally at `localhost:3000`
- [ ] Create `lib/config.js` with event name, games array, branch list
- [ ] Replace the default page with three plain `<section>` blocks: hero
      placeholder, games placeholder, form placeholder
- [ ] Confirm it loads on your phone over local wifi
- [ ] `git commit`

**Done when:** three labelled sections visible on your phone.

---

## Phase 2 — Backend first (target: day 1 afternoon)

Counter-intuitive but correct: build the data path before the UI that feeds it.
If the backend can't work, you need to know now — not on the 20th.

- [ ] Follow `GOOGLE_SHEETS_SETUP.md` — Sheet, headers, Apps Script, deploy
- [ ] Add `APPS_SCRIPT_URL` and `APPS_SCRIPT_SECRET` to `.env.local`
- [ ] Create `app/api/register/route.js`
- [ ] Test it with a hardcoded fake team — a temporary button that posts a fixed
      object is fine
- [ ] Confirm a row lands in the Sheet
- [ ] Test duplicate rejection: same team name, same email, same phone
- [ ] `git commit`

**Done when:** you can make a row appear in the Sheet from the website, and
duplicates are refused.

> If this phase fights you, stop and reassess. This is the load-bearing part. If
> it isn't working by end of day 1, switching to a Google Form is the right call
> and you'll have lost one day rather than four.

---

## Phase 3 — The form (target: day 2)

The actual product.

- [ ] `lib/validation.js` — one pure function per rule from `FORM_SPEC.md`
- [ ] `components/FormStep.jsx` — card shell, Next/Back, progress bar
- [ ] `components/PersonFields.jsx` — the four reused fields
- [ ] `components/RegistrationForm.jsx` — step state, formData object
- [ ] Wire steps 0–4
- [ ] `components/ReviewStep.jsx`
- [ ] Connect submit to `/api/register`
- [ ] `components/SuccessScreen.jsx` (WhatsApp block hidden while link is empty)
- [ ] `lib/draftStorage.js` — save, restore, clear
- [ ] Error states: network failure, duplicate, validation
- [ ] `git commit`

**Done when:** you can complete a real registration end to end on your phone,
refresh mid-form without losing data, and see the row in the Sheet.

### 🚩 Ship checkpoint

**Deploy now** (`DEPLOY_VERCEL.md`), even though it's unstyled. From this point
the project is viable. Everything after is improvement, not survival.

---

## Phase 4 — Design (target: day 3 morning)

Make it look like an E-Cell event.

- [ ] Colour tokens in `globals.css` from `DESIGN_SYSTEM.md`
- [ ] Fonts via `next/font/google`
- [ ] Style the card, inputs, buttons, progress bar
- [ ] Style the form's error states
- [ ] Build the games section — three title-only cards
- [ ] Build the **static** hero: text, amber glow, scroll cue, skip link
      (this is Tier 3 from `ANIMATION_SPEC.md`)
- [ ] Step transition animations
- [ ] Check at 320px, 390px and 430px widths
- [ ] `git commit` and push

**Done when:** it looks good on a phone, with no particle effect yet.

---

## Phase 5 — Animation (target: day 3 afternoon / day 4 morning)

Only now. Only if Phases 1–4 are genuinely finished.

- [ ] Tier detection (`prefers-reduced-motion`, hardware hints, FPS measurement)
- [ ] Sticky scroll container and progress calculation
- [ ] `ParticleCanvas.jsx`: text pixel sampling → particle array
- [ ] Logo sampling → target positions
- [ ] Shuffle and pair the two sets
- [ ] The scroll-scrubbed animation loop
- [ ] Performance tuning against the budget
- [ ] Error boundary around the hero
- [ ] Test on a mid-range Android
- [ ] `git commit` and push

**Time-box this.** If it isn't working after four focused hours, stop and keep
Tier 3. That's not defeat — Tier 3 is a clean, professional transition, and a
stuttering particle effect is worse than no particle effect.

---

## Phase 6 — Test and launch (target: day 4)

- [ ] Work through `TESTING.md` completely
- [ ] Have someone else register a fake team without any guidance from you
- [ ] Delete every `TEST-` row
- [ ] Confirm the event name (3.0 vs 4.0)
- [ ] Verify the branch list against the official RBU list
- [ ] OG image and WhatsApp preview
- [ ] Sheet shared with the organising team
- [ ] Final deploy
- [ ] Send the link

---

## If you fall behind

Cut in this order:

1. **Particle animation** → Tier 3. Saves most of a day.
2. **Custom styling** → plain dark theme with amber buttons. Saves half a day.
3. **Draft saving** → drop it. Saves a couple of hours. Costs a few annoyed users.
4. **Review step** → submit directly from step 4. Saves an hour.
5. **Everything** → Google Form. Twenty minutes.

Cut from the top. Number 5 is a legitimate outcome, not a failure — the site can
be finished afterwards and used for the next event.

---

## Progress

Update as you go.

```
Phase 1  Skeleton    [ ]
Phase 2  Backend     [ ]
Phase 3  Form        [ ]   ← viable from here
Phase 4  Design      [ ]
Phase 5  Animation   [ ]
Phase 6  Launch      [ ]
```
