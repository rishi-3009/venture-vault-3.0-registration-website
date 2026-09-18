# Assets

What images the project needs, what shape they must be in, and what to do about
the files currently available.

---

## Current asset situation

**What exists:**
- A Venture Vault **2.0** poster (landscape, ~1536×1024, JPEG)
- A screenshot of the E-Cell RBU **Instagram profile picture** (circular crop,
  dark background, logo occupying roughly 770px of a 1179px-wide screenshot)

**Neither is usable as-is.** Details below.

---

## The poster — decided: not used

**Decision made: the hero is a plain black background with "Venture Vault 3.0" in
amber. No poster image, no background photograph.** The rest of this section
records why, in case anyone asks later or a 3.0 poster appears.

The 2.0 poster can't be used for 3.0 for several independent reasons:

1. It says **2.0**.
2. It features three people (the Licksters founders and host) who **are not
   attending this year**.
3. It lists **Meme Marketing** and a **live founder interaction** — this year's
   games are Reel Marketing, Baggage Battle and Monopoly.
4. It's **3:2 landscape with dense baked-in text**. On a 390px-wide phone, that
   text becomes illegible. Cropping to portrait destroys the composition.

### The hero, as decided

Built entirely in code. Keep it restrained:

- Near-black background (`--vv-black`) — no image
- **"VENTURE VAULT 3.0"** in Space Grotesk, amber (`--vv-amber`), centred
- A soft radial amber bloom behind the text (see `DESIGN_SYSTEM.md`) — subtle,
  not a spotlight
- Scroll cue below; skip-to-registration link

Nothing else. No decorative motifs, no paper planes, no oversized V treatment.
The particle effect provides the visual interest; a busy static hero would fight
with it.

**Why code rather than an image:**
- Sharp at every screen size and pixel density — no blur on a high-DPR phone
- Loads in kilobytes instead of a megabyte
- The text is real text: selectable, readable by screen readers, indexed by search
- The particle effect needs to sample text pixels anyway, and it can sample
  rendered text far more cleanly than a photograph
- No dependency on an image editor or a designer's availability

**If a real 3.0 poster does get designed** and someone wants it in the hero after
all, request a **portrait or square crop (4:5 or 1:1), minimum 1200px wide, with
no critical text** — text lives in HTML, not baked into the image. It could then
sit behind the hero at low opacity (10–20%) without hurting legibility. This is
not currently planned.

---

## The E-Cell logo — what to request

The Instagram screenshot won't work for the particle effect, which samples the
alpha channel of a transparent image. The screenshot has an opaque black circular
background, so every pixel is opaque and the sampling would produce a filled disc,
not the logo shape.

**Ask the E-Cell design team for the original logo file.** Specifically:

> "Can I get the E-Cell RBU logo as an SVG, or a PNG with a transparent
> background, at least 1000px wide? The version on Instagram has the black circle
> baked in and I need just the mark."

Someone on the design team will have the original. This takes one message.

**What to request:**

| File | Format | Size | Notes |
|---|---|---|---|
| `ecell-logo.png` | PNG, transparent | ≥1000px wide | The diamond/arrow mark. Separate from the wordmark if possible. |
| `ecell-logo.svg` | SVG | — | Preferred if it exists; can be rasterised at any size |
| `ecell-wordmark.png` | PNG, transparent | ≥1000px wide | "E-CELL RBU" text, if separate |

Place in `public/`.

### If the original genuinely can't be obtained

Fall back to rendering **"E-CELL RBU"** as styled text in Space Grotesk, and
sample *that* for the particle target. The sequence becomes text → particles →
text, which still works well visually. Don't try to reconstruct the logo mark by
hand from a screenshot — a hand-traced approximation of an organisation's logo
looks worse than clean type, and it isn't your mark to redraw.

---

## Preparing the logo for particle sampling

Once you have a transparent PNG:

1. Check it actually has transparency — open it over a light background. If you
   see a box, it doesn't.
2. Trim excess transparent padding so the mark fills its bounds.
3. Keep it high contrast. Soft gradients and thin strokes sample poorly; solid
   shapes sample cleanly.
4. Target roughly 800–1200px on the longest edge. Larger is wasted work during
   sampling.

---

## Other assets needed

### Favicon
`app/icon.png`, 512×512. The E-Cell mark on the black background works well here —
the Instagram screenshot is actually fine for this one, cropped square, since
there's no transparency requirement.

### Open Graph image
`public/og-image.jpg`, **1200×630**. This is the preview card that appears when
the link is shared on WhatsApp — which is how essentially all 500 people will
first see it. Worth getting right.

Contents: black background, amber glow, "VENTURE VAULT 3.0", "E-Cell RBU", and
"Register Now". Large text — WhatsApp renders this small.

Set it in `layout.js` metadata:

```js
openGraph: {
  title: 'Venture Vault 3.0 — E-Cell RBU',
  description: 'Register your team.',
  images: ['/og-image.jpg'],
}
```

**Test the WhatsApp preview before sharing widely.** Send the deployed link to
yourself. If the preview is broken or blank, fix it then — WhatsApp caches
aggressively and a bad first impression sticks.

---

## Fonts

No files needed. Both fonts load through `next/font/google`, which downloads and
self-hosts them at build time:

```js
import { Space_Grotesk, Inter } from 'next/font/google'
```

Don't use a `<link>` to Google Fonts — it's slower and causes a visible font swap.

---

## Image optimisation

Use `next/image` for any raster image. It serves modern formats and correct sizes
automatically.

Exception: the logo used for particle sampling must be loaded as a plain
`Image` object in JavaScript, not through `next/image`, because you need direct
pixel access via canvas.

---

## Asset checklist

- [ ] Transparent E-Cell logo obtained (or text fallback decided)
- [ ] Logo trimmed and placed in `public/`
- [ ] Favicon created
- [ ] OG image created at 1200×630
- [ ] WhatsApp link preview tested on a real phone
- [ ] Every image under 300KB
- [ ] Nothing in the repo references 2.0 or the Licksters guests
