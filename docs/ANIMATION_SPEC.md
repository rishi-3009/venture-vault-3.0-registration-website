# Hero Animation Specification

The scroll-driven particle sequence. **This is the hardest and most optional part
of the project.** Build it last. See `BUILD_PLAN.md`.

---

## The honest risk assessment

Read this before starting.

A canvas particle system redraws thousands of elements 60 times a second. On a
mid-range Android phone — which most of the 500 registrants are using — this can
stutter, heat the device, and drain battery. And it sits *in front of* the thing
they came to do.

So the spec below defines **three tiers**. Build Tier 1, but implement the tier
detection first, so you always have somewhere to fall back to. Shipping Tier 3 on
time beats shipping a janky Tier 1 late.

---

## The sequence

A sticky canvas inside a tall scroll container. Scroll position drives animation
progress — this is a scrubbed timeline, not a timed animation. Scrolling back up
runs it backwards.

**The E-Cell logo sits above "VENTURE VAULT 3.0" from the first frame — one
lockup, not two states of the same shape.** There is no separate "particles
travel from the text into the logo" phase anymore; both break apart together
and the form appears right after.

| Progress | Phase | What happens |
|---|---|---|
| 0.00 – 0.15 | **Assembled** | Logo (crisp image) above "VENTURE VAULT 3.0" (particle cloud), both still. Amber glow behind. |
| 0.15 – 0.60 | **Shatter** | Every particle — logo and text together — bursts outward from where it's sitting, with slight turbulence. |
| 0.55 – 0.95 | **Dissolve** | Alpha fades to 0; background glow dims to black. Overlaps the tail of the shatter on purpose. |

Container height: **220vh** (100vh sticky viewport + 120vh of scroll travel).
Shorter than a five-phase sequence needs, on purpose — the form should feel
close, not like a separate destination three scrolls away.

---

## How it works technically

**Getting particle positions from text:**
1. Create an offscreen canvas.
2. Draw "VENTURE VAULT 3.0" onto it in the display font.
3. Read the pixel data with `getImageData()`.
4. Walk the pixels on a grid step. Wherever alpha > 128, record that coordinate.
5. Those coordinates are your particle start positions.

**Getting logo positions:** identical process, drawing the logo PNG instead.
This is why the logo must have a transparent background — you're sampling alpha.

**Two independent point clouds, not one pair.** The logo's points and the text's
points each keep their own single resting position — the logo cloud sits above
the text cloud, forming the lockup. There's nothing to pair or shuffle-to-match
between them, since neither one turns into the other.

**Animating:** each particle stores its resting point, a random drift angle, and a
per-particle noise seed. "Shatter" moves it outward from that resting point along
its own angle, distance driven by progress with easing; "dissolve" just fades
alpha to 0. Add small per-particle noise throughout so nothing moves as a rigid
block.

---

## Performance budget

| | Mobile | Desktop |
|---|---|---|
| Grid sampling step | 5px | 3px |
| Max particles | **1,200** | 3,000 |
| Particle size | 1.5–2px | 2–3px |
| Target frame rate | 30fps acceptable | 60fps |

Non-negotiable techniques:

- **Size the canvas to `devicePixelRatio`,** capped at 2. A 3x-DPR phone rendering
  at full resolution is triple the pixel work for no visible gain.
- **Never allocate inside the draw loop.** Create the particle array once. A `new`
  call per frame triggers garbage collection and causes periodic stutter.
- **Batch fills by colour.** One `fillStyle` set, then all the `fillRect` calls.
- **Use `fillRect`, not `arc()`.** Squares at 2px are visually identical to circles
  and dramatically cheaper.
- **Read scroll position with IntersectionObserver + rAF,** never a raw scroll
  listener doing layout reads — that causes forced synchronous layout.
- **Stop the loop when the hero is off-screen.** Cancel the rAF. There's no reason
  to burn battery animating something nobody can see.

---

## Tier detection

Run once on mount, before any rendering:

```
Tier 3 if any of:
  - prefers-reduced-motion: reduce
  - navigator.hardwareConcurrency <= 4
  - navigator.deviceMemory <= 4        (undefined on iOS — ignore if absent)
  - canvas 2D context unavailable

Tier 2 if:
  - measured FPS < 30 over the first 60 frames  → downgrade live

Tier 1 otherwise
```

**Live downgrade matters.** Device capability hints are unreliable; measured
frame rate is not. If the first second of animation is slow, drop a tier
immediately rather than subjecting them to three seconds of stutter.

### Tier 1 — Full
Everything above. Particle shatter, transit, reform.

### Tier 2 — Reduced
Same sequence, ~400 particles, larger and sparser. Reads as a stylised dissolve
rather than a fine-grained shatter. Still genuinely good.

### Tier 3 — Static
No canvas. CSS only: text scales up slightly and fades out as the logo fades in,
driven by scroll position. Container shortens to 150vh. Costs nothing, works
everywhere, and honestly looks clean.

---

## Mobile specifics

- **Test on a real mid-range Android.** iPhone and a devtools mobile emulator both
  give you a falsely optimistic picture.
- **Don't hijack scroll.** No scroll-jacking, no `overscroll-behavior` tricks. If
  someone wants to flick past the animation straight to the form, let them.
- **Add a scroll-down affordance** on first load — a small bouncing chevron. Without
  it, some people will sit on a static hero assuming the page is broken.
- **Add a "Skip to registration" link** in the hero. Some people arrive having
  already decided. Making them scroll through a 250vh animation is hostile.
- **Watch the battery/heat.** If your test phone gets warm in 30 seconds, the
  particle count is too high.

---

## Failure handling

Wrap the hero in an error boundary. If the canvas throws for any reason, render
Tier 3 and carry on. **A crash in the animation must never prevent registration.**

Also handle:
- Resize / orientation change → recompute positions, debounced ~200ms
- Tab backgrounded → pause the loop (`document.hidden`)
- Logo image fails to load → skip straight to Tier 3

---

## Definition of done

- [ ] Runs at ≥30fps on a mid-range Android
- [ ] Phone doesn't get noticeably warm
- [ ] Scrubbing backwards works smoothly
- [ ] Tier 3 fallback tested by forcing it manually
- [ ] `prefers-reduced-motion` honoured
- [ ] Form still works with the canvas deliberately broken
- [ ] Skip link present and working

---

## If you run out of time

Ship Tier 3. It's a clean, professional fade transition that takes an hour to
build and never breaks. **The registration form working on the 21st matters
infinitely more than particles.**
