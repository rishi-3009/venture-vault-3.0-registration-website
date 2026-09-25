"use client";

import { useEffect, useRef } from "react";
import { EVENT_NAME } from "@/lib/config";

export default function HeroFallback({ progressRef, active }) {
  const groupRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!active) return;

    function draw() {
      const p = progressRef.current;
      const group = groupRef.current;

      if (group) {
        // Logo and text are one lockup here — they scale up slightly and
        // fade out together, directly to black, instead of one replacing
        // the other.
        const dissolve = Math.min(1, p / 0.7);
        group.style.opacity = String(1 - dissolve);
        group.style.transform = `scale(${1 + dissolve * 0.08}) translateY(${-dissolve * 24}px)`;
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, progressRef]);

  return (
    // pb-[28dvh] shifts the centred lockup up to ~36% of the screen height,
    // matching where ParticleCanvas places it.
    <div className="absolute inset-0 flex items-center justify-center pb-[28dvh]" aria-hidden="true">
      <div ref={groupRef} className="flex flex-col items-center gap-4 transition-none">
        {/* eslint-disable-next-line @next/next/no-img-element -- this element's
            opacity/transform are driven imperatively every rAF tick (see the
            effect above); next/image's wrapper markup fights that. Already
            compressed to ~274KB, within the docs/ASSETS.md budget. */}
        <img src="/ecell-logo.png" alt="" className="w-[140px] md:w-[200px]" />
        {/* Same look as the particle version: pixel font, Mario brick
            colour, black drop shadow one font-pixel down-right. */}
        <div className="text-center font-pixel text-[32px] leading-[1.4] text-[#cb4f1b] uppercase [text-shadow:0.125em_0.125em_0_#000] md:text-[56px]">
          {EVENT_NAME.split(" ")[0]}
          <br />
          {EVENT_NAME.split(" ").slice(1).join(" ")}
        </div>
      </div>
    </div>
  );
}
