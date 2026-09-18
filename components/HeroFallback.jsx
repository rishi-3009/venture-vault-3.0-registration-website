"use client";

import { useEffect, useRef } from "react";
import { EVENT_NAME } from "@/lib/config";

export default function HeroFallback({ progressRef, active }) {
  const textRef = useRef(null);
  const logoRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!active) return;

    function draw() {
      const p = progressRef.current;
      const text = textRef.current;
      const logo = logoRef.current;

      if (text && logo) {
        // Text is visible early, scales up slightly and fades as the logo fades in.
        const textFade = 1 - Math.min(1, p / 0.6);
        const textScale = 1 + Math.min(1, p / 0.6) * 0.15;
        text.style.opacity = textFade;
        text.style.transform = `scale(${textScale})`;

        const logoIn = Math.max(0, Math.min(1, (p - 0.4) / 0.35));
        const logoOut = Math.max(0, Math.min(1, (p - 0.85) / 0.15));
        logo.style.opacity = logoIn * (1 - logoOut);
        logo.style.transform = `scale(${0.9 + logoIn * 0.1}) translateY(${-logoOut * 24}px)`;
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, progressRef]);

  return (
    <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
      <div
        ref={textRef}
        className="absolute font-display text-[44px] leading-[1.05] tracking-tight text-vv-amber uppercase transition-none md:text-[88px]"
      >
        {EVENT_NAME}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- this element's
          opacity/transform are driven imperatively every rAF tick (see the
          effect above); next/image's wrapper markup fights that. Already
          compressed to ~274KB, within the docs/ASSETS.md budget. */}
      <img
        ref={logoRef}
        src="/ecell-logo.png"
        alt=""
        className="absolute w-[200px] opacity-0 md:w-[280px]"
      />
    </div>
  );
}
