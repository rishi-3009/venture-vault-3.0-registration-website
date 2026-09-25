"use client";

import { useEffect, useRef, useState } from "react";
import { EVENT_NAME } from "@/lib/config";

// Mario brick colours (NES palette) — the dark brick fill and its lighter
// highlight, to match the pixel-art hero background.
const TEXT_BRICK = [203, 79, 27]; // #cb4f1b
const TEXT_BRICK_LIGHT = [252, 152, 56];
const LOGO_WHITE = [225, 225, 228];
const LOGO_WHITE_BRIGHT = [255, 255, 255];

// "VENTURE" / "VAULT 3.0" on two lines, so the text can be much bigger on a
// narrow phone screen than one long line would allow.
const TEXT_WORDS = EVENT_NAME.toUpperCase().split(" ");
const TEXT_LINES = [TEXT_WORDS[0], TEXT_WORDS.slice(1).join(" ")];

// Offscreen sampling canvas for the text — generous size so the text never
// clips; particles are normalised by half-width so the exact size doesn't
// matter as long as nothing gets cut off.
const TEXT_CANVAS_W = 1800;
const TEXT_CANVAS_H = 320;
const TEXT_FONT_PX = 100;
// Distance between the two lines' centres, and the whole block's height,
// in sampling-canvas pixels.
const TEXT_LINE_GAP = 140;
const TEXT_BLOCK_H = TEXT_FONT_PX + TEXT_LINE_GAP;

// Draws the two text lines centred on (x, y). Shared by the sampling canvas
// and the crisp on-screen text so both land in exactly the same place.
function drawTextLines(ctx, x, y, fontPx, fontFamily) {
  const lineOffset = (TEXT_LINE_GAP / 2) * (fontPx / TEXT_FONT_PX);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${fontPx}px ${fontFamily}`;
  ctx.fillText(TEXT_LINES[0], x, y - lineOffset);
  ctx.fillText(TEXT_LINES[1], x, y + lineOffset);
}

function isMobileViewport() {
  return window.innerWidth < 768;
}

// Deterministic per-particle "noise" — a function of the particle's seed and
// the current progress, not accumulated over time. That's what makes
// scrubbing backwards look right: there's no random walk to reverse.
function wobble(seed, t) {
  return Math.sin(seed * 12.9898 + t * 6.283185);
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function rgb([r, g, b]) {
  return `rgb(${r}, ${g}, ${b})`;
}

function samplePoints(ctx, width, height, step) {
  const { data } = ctx.getImageData(0, 0, width, height);
  const points = [];
  // Round to integer pixel indices so fractional steps (finer than 1px
  // apart in sampling terms) work correctly for denser point clouds.
  for (let y = 0; y < height; y += step) {
    const yi = Math.round(y);
    for (let x = 0; x < width; x += step) {
      const xi = Math.round(x);
      const alpha = data[(yi * width + xi) * 4 + 3];
      if (alpha > 128) points.push({ x: xi, y: yi });
    }
  }
  return points;
}

function shuffle(array) {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function ParticleCanvas({ tier, progressRef, active, onDowngrade }) {
  const canvasRef = useRef(null);
  const fontProbeRef = useRef(null);
  const fontFamilyRef = useRef("sans-serif");
  const particlesRef = useRef([]);
  const logoImageRef = useRef(null);
  const dprRef = useRef(1);
  const rafRef = useRef(null);
  const fpsStatsRef = useRef({ frames: 0, start: 0, reported: false });
  const [hidden, setHidden] = useState(false);
  const [fatalError, setFatalError] = useState(null);

  // Re-throw so the HeroErrorBoundary above us can catch it. Error boundaries
  // only catch errors thrown during render, not inside async callbacks — so
  // async failures below get stashed in state and re-thrown here.
  if (fatalError) throw fatalError;

  // Build the particle set once per tier: sample the text and the logo into
  // two independent point clouds. Unlike the old "shatter into logo" version,
  // neither shape travels to the other — each particle keeps a single resting
  // position (the logo's cloud sits above the text's — see the draw loop),
  // so there's no pairing/shuffling-to-match-counts step anymore.
  useEffect(() => {
    let cancelled = false;

    async function setup() {
      try {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!ctx) throw new Error("2D canvas context unavailable");

        await document.fonts.ready;
        if (cancelled) return;

        const mobile = isMobileViewport();
        // Fine enough that letterforms and the logo mark read as solid, not
        // stippled — random point sampling needs real oversampling to look
        // "filled" rather than speckled with gaps. The logo image is a denser
        // shape packed into a smaller area than the text, so it gets its own
        // (finer) step.
        const step = tier === 2 ? (mobile ? 7 : 5) : mobile ? 3 : 1.5;
        const logoStep = tier === 2 ? (mobile ? 6 : 4) : mobile ? 2 : 1;

        const fontFamily =
          getComputedStyle(fontProbeRef.current).fontFamily || "sans-serif";
        // Kept for the draw loop, which needs it every frame to render the
        // crisp text overlay (see below) at the current on-screen scale.
        fontFamilyRef.current = fontFamily;
        // fonts.ready alone can resolve before the pixel font has actually
        // been fetched — ask for it explicitly so the text isn't sampled in
        // a fallback font.
        await document.fonts.load(`${TEXT_FONT_PX}px ${fontFamily}`);
        if (cancelled) return;

        const textCanvas = document.createElement("canvas");
        textCanvas.width = TEXT_CANVAS_W;
        textCanvas.height = TEXT_CANVAS_H;
        const textCtx = textCanvas.getContext("2d");
        textCtx.fillStyle = "#fff";
        drawTextLines(textCtx, TEXT_CANVAS_W / 2, TEXT_CANVAS_H / 2, TEXT_FONT_PX, fontFamily);
        const textPoints = samplePoints(textCtx, TEXT_CANVAS_W, TEXT_CANVAS_H, step);

        const logo = new Image();
        const logoLoaded = new Promise((resolve, reject) => {
          logo.onload = resolve;
          logo.onerror = () => reject(new Error("Logo image failed to load"));
        });
        logo.src = "/ecell-logo.png";
        await logoLoaded;
        if (cancelled) return;
        logoImageRef.current = logo;

        const logoCanvas = document.createElement("canvas");
        logoCanvas.width = logo.naturalWidth;
        logoCanvas.height = logo.naturalHeight;
        const logoCtx = logoCanvas.getContext("2d");
        logoCtx.drawImage(logo, 0, 0);
        const logoPoints = samplePoints(
          logoCtx,
          logo.naturalWidth,
          logo.naturalHeight,
          logoStep
        );

        if (textPoints.length === 0 || logoPoints.length === 0) {
          throw new Error("Particle sampling produced no points");
        }

        // Same total particle budget as before, now split across two shapes
        // instead of spent on one — proportionally to how much each one
        // sampled, so neither is starved relative to its own detail.
        const maxParticles = tier === 2 ? (mobile ? 450 : 700) : mobile ? 3500 : 14000;
        const totalSampled = textPoints.length + logoPoints.length;
        const textBudget = Math.min(
          textPoints.length,
          Math.round(maxParticles * (textPoints.length / totalSampled))
        );
        const logoBudget = Math.min(logoPoints.length, maxParticles - textBudget);

        const textHalf = TEXT_CANVAS_W / 2;
        const logoHalf = logo.naturalWidth / 2;

        const textParticles = shuffle(textPoints)
          .slice(0, textBudget)
          .map((pt) => ({
            group: "text",
            x0: (pt.x - textHalf) / textHalf,
            y0: (pt.y - TEXT_CANVAS_H / 2) / textHalf,
            seed: Math.random() * 1000,
            driftAngle: Math.random() * Math.PI * 2,
            bright: Math.random() < 0.3,
          }));

        const logoParticles = shuffle(logoPoints)
          .slice(0, logoBudget)
          .map((pt) => ({
            group: "logo",
            x0: (pt.x - logoHalf) / logoHalf,
            y0: (pt.y - logo.naturalHeight / 2) / logoHalf,
            seed: Math.random() * 1000,
            driftAngle: Math.random() * Math.PI * 2,
            bright: Math.random() < 0.3,
          }));

        particlesRef.current = [...logoParticles, ...textParticles];
        fpsStatsRef.current = { frames: 0, start: 0, reported: false };
      } catch (err) {
        if (!cancelled) setFatalError(err);
      }
    }

    setup();
    return () => {
      cancelled = true;
    };
  }, [tier]);

  // Size the canvas's actual pixel buffer to devicePixelRatio (capped at 2),
  // recomputed on resize/orientation change, debounced.
  useEffect(() => {
    function resize() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      dprRef.current = dpr;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
    }

    resize();
    let timer;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(resize, 200);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(timer);
    };
  }, []);

  // Pause the loop when the tab isn't visible — no reason to burn battery
  // animating something nobody can see.
  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // The draw loop. Runs only while the hero is on-screen and the tab is visible.
  useEffect(() => {
    if (!active || hidden) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    function draw() {
      try {
        const particles = particlesRef.current;
        const { width, height } = canvas;
        ctx.clearRect(0, 0, width, height);

        if (particles.length === 0) {
          rafRef.current = requestAnimationFrame(draw);
          return;
        }

        const stats = fpsStatsRef.current;
        if (!stats.reported) {
          if (stats.frames === 0) stats.start = performance.now();
          stats.frames += 1;
          if (stats.frames >= 60) {
            const elapsed = performance.now() - stats.start;
            const fps = 60000 / elapsed;
            stats.reported = true;
            if (tier === 1 && fps < 30) onDowngrade?.();
          }
        }

        const p = progressRef.current;
        const dpr = dprRef.current;
        const cx = width / 2;
        const mobile = width < 768 * dpr;

        // Logo sits directly above the text as one lockup, centred at 36%
        // of the screen height — above the busy bottom of the background
        // image. textScale is the on-screen width of the widest line
        // ("VAULT 3.0").
        const textScale = mobile ? width * 0.85 : Math.min(width * 0.42, height * 0.9);
        const logoScale = Math.min(width, height) * (mobile ? 0.16 : 0.2);
        const textH = (TEXT_BLOCK_H / (TEXT_CANVAS_W / 2)) * textScale;
        const lockupGap = logoScale * 0.35;
        const lockupH = logoScale * 2 + lockupGap + textH;
        const lockupTop = height * 0.36 - lockupH / 2;
        const logoCy = lockupTop + logoScale;
        const textCy = lockupTop + logoScale * 2 + lockupGap + textH / 2;
        const size = (tier === 2 ? 3.5 : mobile ? 1.75 : 2.5) * dpr;

        // Three phases, all driven by scroll progress `p`:
        //  0.00–0.15  Assembled — logo shown as the crisp source image, text
        //             as its particle cloud at rest, nothing moving.
        //  0.15–0.60  Shatter — every particle, logo and text together,
        //             bursts outward from its resting spot.
        //  0.55–0.95  Dissolve — alpha fades to 0 so the form appears on
        //             plain black. Deliberately overlaps the shatter's tail.
        const burstT = Math.min(1, Math.max(0, (p - 0.15) / 0.45));
        const eased = easeInOutCubic(burstT);
        // How much of the crisp logo image is still showing — fades out right
        // up to where the shatter (burstT) takes over, so there's no gap
        // where a static, grainier dot cloud is exposed before it starts moving.
        const crispT = Math.min(1, Math.max(0, 1 - p / 0.15));

        let alpha = 1;
        let driftUp = 0;
        if (p >= 0.55) {
          const d = Math.min(1, (p - 0.55) / 0.4);
          alpha = 1 - d;
          driftUp = d * height * 0.12;
        }

        // Four passes (group x bright/dim). Both groups' dot clouds fade in
        // from behind their crisp counterparts (drawn further below) instead
        // of doubling up with them — a dot cloud alone never reads as solid
        // the way real text/an image does, so nothing is shown as pure dots
        // until it's actually started bursting apart.
        const passes = [
          { group: "text", bright: false, color: rgb(TEXT_BRICK), alpha: alpha * (1 - crispT) },
          { group: "text", bright: true, color: rgb(TEXT_BRICK_LIGHT), alpha: alpha * (1 - crispT) },
          { group: "logo", bright: false, color: rgb(LOGO_WHITE), alpha: alpha * (1 - crispT) },
          { group: "logo", bright: true, color: rgb(LOGO_WHITE_BRIGHT), alpha: alpha * (1 - crispT) },
        ];

        for (const pass of passes) {
          if (pass.alpha <= 0) continue;
          ctx.globalAlpha = pass.alpha;
          ctx.fillStyle = pass.color;

          for (let i = 0; i < particles.length; i++) {
            const particle = particles[i];
            if (particle.group !== pass.group || particle.bright !== pass.bright) continue;

            const baseCy = particle.group === "text" ? textCy : logoCy;
            const scale = particle.group === "text" ? textScale : logoScale;
            const restX = cx + particle.x0 * scale;
            const restY = baseCy + particle.y0 * scale;

            // Scaled by burstT so it's exactly zero at rest — otherwise the
            // wobble (a function of seed and progress, not of burstT) keeps
            // nudging particles even while assembled, and dense text turns
            // ragged instead of sitting still.
            const noiseX = wobble(particle.seed, p * 4) * 4 * dpr * burstT;
            const noiseY = wobble(particle.seed + 50, p * 4) * 4 * dpr * burstT;
            const burstDist = eased * scale * 0.9;

            const x = restX + Math.cos(particle.driftAngle) * burstDist + noiseX;
            const y = restY + Math.sin(particle.driftAngle) * burstDist + noiseY - driftUp;

            ctx.fillRect(x - size / 2, y - size / 2, size, size);
          }
        }

        ctx.globalAlpha = 1;

        // The crisp source text — real fillText, sized and positioned to
        // land exactly on top of the text dot cloud's resting spot, so the
        // crossfade between the two is seamless. Same reasoning as the logo
        // below: dots alone can't carry the first impression.
        if (crispT > 0) {
          ctx.globalAlpha = alpha * crispT;
          // The sampling canvas drew this text at TEXT_FONT_PX within a box
          // whose half-width (TEXT_CANVAS_W / 2) maps to `textScale` on
          // screen — matching that ratio here reproduces the same size.
          const fontPx = (TEXT_FONT_PX * textScale) / (TEXT_CANVAS_W / 2);
          // Black drop shadow one "font pixel" down-right (the font is drawn
          // on an 8x8 grid), like the Super Mario title — then the brick fill.
          const shadow = fontPx / 8;
          ctx.fillStyle = "#000";
          drawTextLines(ctx, cx + shadow, textCy - driftUp + shadow, fontPx, fontFamilyRef.current);
          ctx.fillStyle = rgb(TEXT_BRICK);
          drawTextLines(ctx, cx, textCy - driftUp, fontPx, fontFamilyRef.current);
          ctx.globalAlpha = 1;
        }

        // The crisp source logo, visible only in that first sliver of
        // scroll — dot-sampling alone reads as grainy for a mark this
        // detailed, so the real image carries the first impression.
        const logoImage = logoImageRef.current;
        if (logoImage && crispT > 0) {
          ctx.globalAlpha = alpha * crispT;
          ctx.drawImage(
            logoImage,
            cx - logoScale,
            logoCy - logoScale - driftUp,
            logoScale * 2,
            logoScale * 2
          );
          ctx.globalAlpha = 1;
        }

        rafRef.current = requestAnimationFrame(draw);
      } catch (err) {
        cancelAnimationFrame(rafRef.current);
        setFatalError(err);
      }
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, hidden, tier, progressRef, onDowngrade]);

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <canvas ref={canvasRef} className="h-full w-full" />
      <span
        ref={fontProbeRef}
        className="font-pixel"
        style={{ position: "absolute", visibility: "hidden", top: -9999 }}
      >
        x
      </span>
    </div>
  );
}
