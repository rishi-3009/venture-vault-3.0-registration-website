"use client";

import { useEffect, useRef, useState } from "react";
import { ORGANISER } from "@/lib/config";

// A small branded strip that sits at the top of the register section. The
// hero's canvas has already scrolled fully away by the time you're here, so
// without this the section opened on a slab of plain black before "Register
// Your Team" — this fills that space and ties the form back to E-Cell.
// Fades in once, the first time it scrolls into view (not scroll-scrubbed
// like the hero — just a one-shot reveal, plain CSS transition, no library).
export default function RegisterHeading() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`relative mx-auto mb-10 flex max-w-[480px] items-center justify-center gap-3 transition-all duration-700 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- small, static
          decorative mark; not worth next/image's config for a 36px icon. */}
      <img src="/ecell-logo-header.png" alt="" className="h-9 w-9 object-contain" />
      <span className="font-display text-sm uppercase tracking-[0.2em] text-vv-text-faint">
        {ORGANISER}
      </span>
    </div>
  );
}
