# Testing

Work through this before sending the link to anyone. 500 people are about to use
this, mostly at the same time, mostly on phones, some on bad connections.

---

## Test on real devices

Browser devtools mobile emulation is not a phone. It lies about touch, scroll
momentum, keyboard behaviour, and performance.

**Minimum:** your own phone, plus one other person's phone of a different brand.
**Ideal:** one iPhone, one mid-range Android, one older/cheaper Android.

---

## Form functionality

### Happy path
- [ ] Complete a full valid registration start to finish
- [ ] Row appears in the Sheet with every column correct and in the right place
- [ ] Success screen shows the correct team name
- [ ] Draft is cleared after success (refresh → clean form, not the old data)

### Validation — every field
- [ ] Empty team name blocked
- [ ] 1-character team name blocked
- [ ] 41-character team name blocked
- [ ] Team name with `@#$%` blocked
- [ ] Empty name blocked
- [ ] Name with digits blocked
- [ ] No branch selected → blocked
- [ ] "Other" selected with empty text → blocked
- [ ] `notanemail` blocked
- [ ] `someone@gmail.com` blocked with the RBU-domain message
- [ ] `SOMEONE@RBUNAGPUR.IN` accepted (case-insensitive) and stored lowercase
- [ ] 9-digit phone blocked
- [ ] 11-digit phone blocked
- [ ] Phone starting with 5 blocked
- [ ] `+91 98765 43210` accepted and stored as 10 digits
- [ ] `098765 43210` accepted and stored as 10 digits

### Duplicates
- [ ] Same team name → rejected, message names the team
- [ ] Same team name in different case → still rejected
- [ ] New team, reused leader email → rejected, message names the clashing team
- [ ] New team, reused leader phone → rejected
- [ ] New team, member email already used on another team → **accepted** (by design)
- [ ] Same email twice within one team → caught before submit
- [ ] Same phone twice within one team → caught before submit
- [ ] **No partial row is written when a submission is rejected**

### Navigation
- [ ] Next is blocked until the step is valid
- [ ] Back preserves what was typed
- [ ] Back then forward doesn't clear anything
- [ ] Progress indicator is correct on every step
- [ ] Edit links in review jump to the right step and return to review
- [ ] No way to go back from the success screen

---

## Network conditions

The real test. College wifi and 4G in a crowded hall are both bad.

- [ ] Airplane mode mid-submit → clear error, data preserved, retry works
- [ ] Throttle to Slow 3G in devtools → form still usable, submit still succeeds
- [ ] Refresh mid-form → draft restored to the correct step
- [ ] Close the tab entirely, reopen → draft restored
- [ ] **Double-tap Submit rapidly → only one row appears**
- [ ] Submit, then immediately hit back → no duplicate row

> The double-tap test is the most important one here. On a slow connection the
> button appears unresponsive and people tap again. If that creates two rows,
> you'll be cleaning up duplicates by hand.

---

## Mobile experience

- [ ] **Focusing an input does not zoom the page** (16px font rule)
- [ ] Email field brings up the email keyboard
- [ ] Phone field brings up the number pad
- [ ] Keyboard doesn't cover the Next button
- [ ] Autocapitalise is off for email
- [ ] Every tap target is comfortably thumb-sized
- [ ] No horizontal scrolling anywhere
- [ ] Works in portrait and landscape
- [ ] Layout is fine at 320px (small older phones)
- [ ] Scrolling is smooth through the whole page

---

## Animation

- [ ] Runs at acceptable frame rate on a mid-range Android
- [ ] Phone doesn't get warm after 30 seconds
- [ ] Scrubbing backwards is smooth
- [ ] Skip-to-registration link works
- [ ] Scroll cue visible on load
- [ ] `prefers-reduced-motion` enabled → falls back to Tier 3
  - iOS: Settings → Accessibility → Motion → Reduce Motion
  - Android: Settings → Accessibility → Remove animations
- [ ] Break the canvas deliberately (throw an error inside it) → **form still works**
- [ ] Rotate the phone mid-animation → recovers without breaking

---

## Content

- [ ] **Event name is correct — 3.0 or 4.0?**
- [ ] Game names correct and in the right order: Reel Marketing, Baggage Battle,
      Monopoly
- [ ] No leftover reference to 2.0, Meme Marketing, or last year's guests
- [ ] Branch list matches the official RBU list
- [ ] No typos in labels, headings, or error messages
- [ ] Success text reads well
- [ ] E-Cell RBU named correctly everywhere

---

## Sheet

- [ ] Headers match the data being written, column by column
- [ ] 20 columns, nothing shifted
- [ ] Timestamps are in IST, not UTC
- [ ] Sorting by team name doesn't scramble rows (freeze row 1)
- [ ] Sheet shared with the organising team as Viewer
- [ ] **All `TEST-` rows deleted**
- [ ] A second person has confirmed they can open the Sheet link

---

## Sharing

- [ ] Send the link to yourself on WhatsApp — preview image and title look right
- [ ] Link opens correctly from inside the WhatsApp in-app browser
      *(this is where most people will open it, and it behaves differently from
      Chrome or Safari — test it specifically)*
- [ ] Works on Instagram's in-app browser too, if the link goes in a bio
- [ ] Page title is sensible in the browser tab

---

## The real final test

**Hand your phone to someone who hasn't seen this and say nothing.**

Watch where they hesitate. Don't help. Note:

- Did they realise they needed to scroll?
- Did they understand the team-of-4 requirement?
- Did any error message confuse them?
- Did they try to submit with incomplete data?
- How long did it take?

Every point of hesitation is a WhatsApp message you'll be answering on event day.
Fixing them now is cheaper.

---

## Launch day

- [ ] Keep the Sheet open in a tab for the first hour
- [ ] Watch the first few real registrations land
- [ ] Have the Google Form fallback ready to create if something goes badly wrong
- [ ] Tell the organising team what to do if someone reports a problem
