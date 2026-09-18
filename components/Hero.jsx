"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { EVENT_NAME } from "@/lib/config";
import HeroErrorBoundary from "./HeroErrorBoundary";
import HeroFallback from "./HeroFallback";
import ParticleCanvas from "./ParticleCanvas";

// Never during SSR, where `window` doesn't exist.
// ?tier=1/2/3 in the URL is a manual override for testing each tier.
function detectInitialTier() {
  const params = new URLSearchParams(window.location.search);
  const override = params.get("tier");
  if (override === "1" || override === "2" || override === "3") {
    return Number(override);
  }

  const probe = document.createElement("canvas");
  if (!probe.getContext || !probe.getContext("2d")) return 3;

  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return 3;

  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4;
  if (cores <= 2 || memory <= 2) return 2;

  return 1;
}

// The tier needs to (a) read a browser-only value once on mount without
// causing a hydration mismatch, and (b) be downgradable later at runtime if
// the live FPS check says Tier 1 is too slow. useSyncExternalStore covers
// both: getServerSnapshot keeps SSR/first-paint on the safe CSS fallback,
// and downgrade() notifies React the same way a real external store would.
function createTierStore() {
  let value = null;
  let listeners = [];

  return {
    getSnapshot() {
      if (value === null) value = detectInitialTier();
      return value;
    },
    getServerSnapshot() {
      return 3;
    },
    subscribe(listener) {
      listeners.push(listener);
      return () => {
        listeners = listeners.filter((l) => l !== listener);
      };
    },
    downgrade() {
      if (value === 1) {
        value = 2;
        listeners.forEach((listener) => listener());
      }
    },
  };
}

export default function Hero() {
  const wrapperRef = useRef(null);
  const glowRef = useRef(null);
  const cueRef = useRef(null);
  const progressRef = useRef(0);
  const [active, setActive] = useState(false);
  const [tierStore] = useState(createTierStore);
  const tier = useSyncExternalStore(
    tierStore.subscribe,
    tierStore.getSnapshot,
    tierStore.getServerSnapshot
  );

  // Only run the scroll-tracking loop while the hero is actually on screen.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // The progress loop: read scroll position from layout (getBoundingClientRect)
  // inside rAF, never from a scroll event listener, so it can't force a
  // synchronous layout on every scroll tick.
  useEffect(() => {
    if (!active) return;
    let rafId;

    function update() {
      const el = wrapperRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const scrollable = rect.height - window.innerHeight;
        const raw = scrollable > 0 ? -rect.top / scrollable : 0;
        const progress = Math.min(1, Math.max(0, raw));
        progressRef.current = progress;

        if (glowRef.current) {
          // Finishes at progress=0.9, just ahead of the logo's own dissolve
          // (see ParticleCanvas.jsx) — the ambient glow clears first, then
          // the logo, then a beat of plain black before the form appears.
          const glowOpacity = progress < 0.6 ? 1 : Math.max(0, 1 - (progress - 0.6) / 0.3);
          glowRef.current.style.opacity = glowOpacity;
        }
        if (cueRef.current) {
          cueRef.current.style.opacity = progress < 0.05 ? String(1 - progress / 0.05) : "0";
        }
      }
      rafId = requestAnimationFrame(update);
    }

    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, [active]);

  // 280vh = 100vh sticky viewport + 180vh of actual scroll travel, giving
  // the text -> shatter -> logo -> dissolve sequence more room so the logo
  // doesn't snap together too quickly.
  return (
    <section ref={wrapperRef} className="relative h-[280dvh]">
      {/* Real, indexable heading for accessibility/SEO — the canvas/CSS
          animation below is purely decorative (aria-hidden). */}
      <h1 className="sr-only">{EVENT_NAME}</h1>

      <div className="sticky top-0 flex h-[100dvh] flex-col items-center justify-center overflow-hidden bg-vv-black px-5">
        <div
          ref={glowRef}
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% 40%, rgba(245, 166, 35, 0.18) 0%, rgba(122, 62, 0, 0.08) 40%, transparent 70%)",
          }}
        />

        {tier === 3 ? (
          <HeroFallback progressRef={progressRef} active={active} />
        ) : (
          <HeroErrorBoundary progressRef={progressRef} active={active}>
            <ParticleCanvas
              tier={tier}
              progressRef={progressRef}
              active={active}
              onDowngrade={tierStore.downgrade}
            />
          </HeroErrorBoundary>
        )}

        <div
          ref={cueRef}
          className="absolute bottom-10 flex flex-col items-center gap-2 text-vv-text-faint"
        >
          <span className="text-xs">Scroll</span>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="animate-bounce"
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </section>
  );
}
