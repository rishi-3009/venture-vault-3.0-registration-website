# Design System

Black with orange/amber accents, matching E-Cell RBU branding.

---

## Colours

Define as CSS custom properties in `globals.css` and reference them everywhere.
Changing the brand later should mean editing one block.

```css
:root {
  /* Backgrounds */
  --vv-black:        #0A0A0B;   /* page background — near-black, not pure */
  --vv-surface:      #141416;   /* cards, raised panels */
  --vv-surface-2:    #1E1E21;   /* inputs, inner surfaces */
  --vv-border:       #2A2A2E;   /* subtle dividers */

  /* Brand */
  --vv-amber:        #F5A623;   /* primary — buttons, highlights */
  --vv-amber-bright: #FFC145;   /* hover, glow cores */
  --vv-amber-deep:   #C97E10;   /* pressed states */
  --vv-ember:        #7A3E00;   /* deep background glow */

  /* Text */
  --vv-text:         #F5F5F4;   /* primary */
  --vv-text-muted:   #A1A1A6;   /* labels, helper text */
  --vv-text-faint:   #6E6E73;   /* placeholders */

  /* Feedback */
  --vv-error:        #FF6B6B;   /* readable on black — plain red isn't */
  --vv-success:      #4ADE80;
}
```

> **Why `#0A0A0B` and not `#000000`.** Pure black against bright amber creates
> harsh edge contrast, and on OLED phones pure black pixels switch off entirely,
> producing visible smearing during scroll animations. A few points off pure
> black reads identically and behaves better.

> **Why `#FF6B6B` for errors.** Standard `#DC2626` red on a black background is
> too dark to read comfortably. Error text has to be legible at a glance on a
> phone in daylight.

---

## Typography

Two typefaces, both free via `next/font/google`.

| Use | Font | Notes |
|---|---|---|
| Display — hero, headings | **Space Grotesk** (700) | Geometric, slightly technical, has the startup-event feel without being a cliché |
| Body — form, labels, buttons | **Inter** (400/500/600) | Designed for screens, very readable at small sizes |

Load through `next/font/google` in `layout.js`, not a `<link>` tag. Next.js
self-hosts the files and eliminates the layout shift you get when a webfont swaps
in late.

### Scale (mobile first)

| Token | Mobile | Desktop | Use |
|---|---|---|---|
| Display | 44px / 1.05 | 88px | Hero "VENTURE VAULT" |
| H1 | 28px / 1.2 | 36px | Section headings |
| H2 | 20px / 1.3 | 24px | Step headings |
| Body | 16px / 1.5 | 16px | Everything |
| Label | 14px / 1.4 | 14px | Field labels |
| Small | 13px / 1.4 | 13px | Helper and error text |

**Never go below 16px on an input.** iOS Safari zooms the viewport when you focus
an input with a smaller font size, which yanks the layout sideways. This is a
rule, not a preference.

---

## Spacing

Use Tailwind's default scale. Consistent rhythm:

- Between form fields: `mb-5` (20px)
- Card inner padding: `p-6` (24px) mobile, `p-8` desktop
- Between sections: `py-16` mobile, `py-24` desktop
- Page side gutter: `px-5` (20px) — never let text touch the screen edge

---

## Components

### Card (the form container)

```
background: var(--vv-surface)
border: 1px solid var(--vv-border)
border-radius: 20px
padding: 24px
box-shadow: 0 8px 32px rgba(0,0,0,0.4)
max-width: 480px, centred
```

On mobile it should fill the width minus the gutter, not float in a tiny column.

### Primary button (Next, Submit)

```
background: var(--vv-amber)
color: var(--vv-black)          ← dark text on amber, not white
font-weight: 600
height: 52px
border-radius: 12px
width: 100%
```

States: hover → `--vv-amber-bright`; active → `--vv-amber-deep` plus
`scale(0.98)`; disabled → 40% opacity, `cursor: not-allowed`.

> Dark text on amber, always. White on `#F5A623` fails contrast standards badly
> and looks washed out.

### Secondary button (Back)

Transparent background, `--vv-border` outline, `--vv-text-muted` text. Visually
quieter than Next — Back should never compete for the thumb.

### Text input

```
background: var(--vv-surface-2)
border: 1px solid var(--vv-border)
border-radius: 12px
height: 52px
padding: 0 16px
font-size: 16px
color: var(--vv-text)
```

Focus: border becomes `--vv-amber`, plus a soft amber glow
(`box-shadow: 0 0 0 3px rgba(245,166,35,0.15)`).
Error: border `--vv-error`, message below.

### Progress indicator

A thin bar at the top of the card plus "Step 2 of 6" text. Bar fills amber,
`transition: width 300ms ease`. Both matter: the bar is felt, the text is read.

---

## Motion

- Step transitions: 250ms slide + fade. Forward slides left, back slides right.
- Buttons: 150ms.
- Nothing over 400ms except the hero sequence — slow UI feels broken, not elegant.
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)` for most things.

**Respect `prefers-reduced-motion: reduce`:** replace slides with instant changes
or plain opacity fades, and drop the hero to its static fallback. Some people get
genuinely nauseous from scroll-driven motion.

---

## The amber glow

The hero's warm background bloom, reusable behind sections:

```css
background: radial-gradient(
  ellipse 80% 50% at 50% 40%,
  rgba(245, 166, 35, 0.18) 0%,
  rgba(122, 62, 0, 0.08) 40%,
  transparent 70%
);
```

Use sparingly — behind the hero and lightly behind the form card. Everywhere at
once turns the page muddy brown.

---

## Accessibility

- Body text on `--vv-black` must hit 4.5:1 contrast. `--vv-text` and
  `--vv-text-muted` both do; `--vv-text-faint` is for placeholders only.
- Every input needs a real `<label>`, not just a placeholder. Placeholders vanish
  on typing, and someone halfway through a long form forgets which field is which.
- Visible focus ring for keyboard users. Don't `outline: none` without a
  replacement.
- Errors announced with `aria-live="polite"` and linked via `aria-describedby`.
- Never use colour alone to signal an error — pair red with an icon and text.
