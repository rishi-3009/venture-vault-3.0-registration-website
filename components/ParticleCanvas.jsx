"use client";

import { useEffect, useRef, useState } from "react";
import { EVENT_NAME } from "@/lib/config";

const AMBER = [245, 166, 35];
const AMBER_BRIGHT = [255, 193, 69];
const WHITE = [255, 255, 255];

// Offscreen sampling canvas for the text — generous size so the text never
// clips; particles are normalised by half-width so the exact size doesn't
// matter as long as nothing gets cut off.
const TEXT_CANVAS_W = 1800;
const TEXT_CANVAS_H = 320;

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

function lerpColor(from, to, t) {
  const r = Math.round(from[0] + (to[0] - from[0]) * t);
  const g = Math.round(from[1] + (to[1] - from[1]) * t);
  const b = Math.round(from[2] + (to[2] - from[2]) * t);
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

  // Build the particle set once per tier: sample text pixels, sample logo
  // pixels, shuffle both lists and pair them by index.
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
        // Fine enough that letterforms and the logo mark read as solid,
        // not stippled — random point sampling needs real oversampling to
        // look "filled" rather than speckled with gaps. The logo image is a
        // denser shape packed into a smaller area than the text, so it needs
        // its own (finer) step — sharing one step with text and then
        // randomly discarding down to a shared count is what caused the
        // logo to look sparse/grainy while the text looked fine.
        const step = tier === 2 ? (mobile ? 7 : 5) : mobile ? 3 : 1.5;
        const logoStep = tier === 2 ? (mobile ? 6 : 4) : mobile ? 2 : 1;

        const fontFamily =
          getComputedStyle(fontProbeRef.current).fontFamily || "sans-serif";

        const textCanvas = document.createElement("canvas");
        textCanvas.width = TEXT_CANVAS_W;
        textCanvas.height = TEXT_CANVAS_H;
        const textCtx = textCanvas.getContext("2d");
        textCtx.fillStyle = "#fff";
        textCtx.textAlign = "center";
        textCtx.textBaseline = "middle";
        textCtx.font = `700 100px ${fontFamily}`;
        textCtx.fillText(
          EVENT_NAME.toUpperCase(),
          TEXT_CANVAS_W / 2,
          TEXT_CANVAS_H / 2
        );
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

        const maxParticles = tier === 2 ? (mobile ? 450 : 700) : mobile ? 3500 : 14000;
        const count = Math.min(maxParticles, textPoints.length, logoPoints.length);

        // Random pairing looks organic; pairing by index (ordered) produces
        // an unnatural sweeping motion where particles march in lockstep.
        const textSet = shuffle(textPoints).slice(0, count);
        const logoSet = shuffle(logoPoints).slice(0, count);

        const textHalf = TEXT_CANVAS_W / 2;
        const logoHalf = logo.naturalWidth / 2;

        particlesRef.current = textSet.map((start, i) => ({
          startX: (start.x - textHalf) / textHalf,
          startY: (start.y - TEXT_CANVAS_H / 2) / textHalf,
          endX: (logoSet[i].x - logoHalf) / logoHalf,
          endY: (logoSet[i].y - logo.naturalHeight / 2) / logoHalf,
          seed: Math.random() * 1000,
          driftAngle: Math.random() * Math.PI * 2,
          bright: Math.random() < 0.3,
        }));

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
        const cy = height * 0.42;
        const mobile = width < 768 * dpr;
        // Narrow phone screens leave a lot of empty margin at 0.42 (tuned
        // for desktop's wider canvas), so the text reads small — bump it up
        // on mobile to actually use the width.
        const textScale = width * (mobile ? 0.54 : 0.42);
        const logoScale = Math.min(width, height) * 0.28;
        const size = (tier === 2 ? 3.5 : mobile ? 1.75 : 2.5) * dpr;

        // Dissolve finishes at p=0.95, not p=1 — leaving the last 5% of the
        // scroll as guaranteed empty black. Without that buffer the fade's
        // last frame and the sticky panel's release happen at the same
        // scroll pixel, so any timing slop reads as "the logo is still
        // there" right as the form appears underneath it.
        let alpha = 1;
        let driftUp = 0;
        if (p >= 0.75) {
          const d = Math.min(1, (p - 0.75) / 0.2);
          alpha = 1 - d;
          driftUp = d * height * 0.15;
        }

        const shatterT = Math.min(1, Math.max(0, (p - 0.2) / 0.25));
        const transitT = Math.min(1, Math.max(0, (p - 0.45) / 0.25));
        const eased = easeInOutCubic(transitT);
        const noisy = transitT > 0 && transitT < 1;

        // Random-scatter dots can only ever look "filled" up to a point —
        // no amount of density reads as a clean solid shape close-up. So
        // once the particles have essentially landed, crossfade in the real
        // logo image on top (crisp, anti-aliased) and fade the dots out
        // underneath it, instead of asking the dots to *be* the final shape.
        const logoRevealT = Math.min(1, Math.max(0, (transitT - 0.85) / 0.15));

        ctx.globalAlpha = alpha * (1 - logoRevealT);

        // Particles start amber (matching the text) and shift to white
        // (matching the logo's actual colour) as they arrive — driven by
        // the same `eased` value that drives their position, so colour and
        // motion land together.
        const dimColor = lerpColor(AMBER, WHITE, eased);
        const brightColor = lerpColor(AMBER_BRIGHT, WHITE, eased);

        for (let pass = 0; pass < 2; pass++) {
          const isBrightPass = pass === 1;
          ctx.fillStyle = isBrightPass ? brightColor : dimColor;

          for (let i = 0; i < particles.length; i++) {
            const particle = particles[i];
            if (particle.bright !== isBrightPass) continue;

            const driftDist = shatterT * 0.15;
            const shatterX = particle.startX + Math.cos(particle.driftAngle) * driftDist;
            const shatterY = particle.startY + Math.sin(particle.driftAngle) * driftDist;

            const textPxX = cx + shatterX * textScale;
            const textPxY = cy + shatterY * textScale;
            const logoPxX = cx + particle.endX * logoScale;
            const logoPxY = cy + particle.endY * logoScale;

            const noiseX = noisy ? wobble(particle.seed, p * 4) * 6 * dpr : 0;
            const noiseY = noisy ? wobble(particle.seed + 50, p * 4) * 6 * dpr : 0;

            const x = textPxX + (logoPxX - textPxX) * eased + noiseX;
            const y = textPxY + (logoPxY - textPxY) * eased + noiseY - driftUp;

            ctx.fillRect(x - size / 2, y - size / 2, size, size);
          }
        }

        ctx.globalAlpha = 1;

        const logoImage = logoImageRef.current;
        if (logoImage && logoRevealT > 0) {
          ctx.globalAlpha = alpha * logoRevealT;
          ctx.drawImage(
            logoImage,
            cx - logoScale,
            cy - logoScale - driftUp,
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
        className="font-display"
        style={{ position: "absolute", visibility: "hidden", top: -9999 }}
      >
        x
      </span>
    </div>
  );
}
