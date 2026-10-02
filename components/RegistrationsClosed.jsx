import { getImageProps } from "next/image";
import { EVENT_NAME, ORGANISER } from "@/lib/config";

// Same portrait/landscape background pair as the hero (see Hero.jsx), so the
// closed screen looks like the site people already scanned the QR code for.
const bgCommon = { alt: "", sizes: "100vw", loading: "eager" };
const {
  props: { srcSet: bgDesktopSrcSet },
} = getImageProps({ ...bgCommon, src: "/hero-bg-desktop-v2.jpg", width: 1920, height: 1080 });
const {
  props: { srcSet: bgMobileSrcSet, ...bgImgProps },
} = getImageProps({ ...bgCommon, src: "/hero-bg-mobile-v2.jpg", width: 1080, height: 1920 });

// Shown instead of the whole page while REGISTRATIONS_OPEN is false (see
// lib/config.js). Static — no state, no scroll, nothing to click — so it's a
// server component and ships no JavaScript to the phone.
export default function RegistrationsClosed() {
  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-vv-black px-5 py-12">
      <picture>
        <source media="(min-aspect-ratio: 1/1)" srcSet={bgDesktopSrcSet} />
        <img
          {...bgImgProps}
          alt=""
          srcSet={bgMobileSrcSet}
          fetchPriority="high"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
      </picture>
      <div className="pointer-events-none absolute inset-0 bg-black/75" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 30%, rgba(245, 166, 35, 0.18) 0%, rgba(122, 62, 0, 0.08) 40%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto flex w-full max-w-[480px] flex-col items-center text-center">
        <div className="flex items-center justify-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- small, static
              decorative mark; not worth next/image's config for a 36px icon. */}
          <img src="/ecell-logo-header.png" alt="" className="h-9 w-9 object-contain" />
          <span className="font-display text-sm uppercase tracking-[0.2em] text-vv-text-muted">
            {ORGANISER}
          </span>
        </div>

        <h1 className="mt-8 font-pixel text-[28px] leading-[1.4] text-[#cb4f1b] uppercase [text-shadow:0.125em_0.125em_0_#000] md:text-[48px]">
          {EVENT_NAME.split(" ")[0]}
          <br />
          {EVENT_NAME.split(" ").slice(1).join(" ")}
        </h1>

        <h2 className="mt-8 font-pixel text-[16px] leading-[1.6] text-vv-text uppercase md:text-[22px]">
          Registrations are closed
        </h2>

        <p className="mt-6 text-base text-vv-text">
          All slots have been filled. Thank you for the overwhelming response!
        </p>
        <p className="mt-4 text-base text-vv-text-muted">
          Already registered? You&apos;re all set. Keep your Team ID handy and
          stay active in the WhatsApp group for event updates.
        </p>

        <p className="mt-8 font-pixel text-[12px] leading-[1.6] text-vv-amber uppercase md:text-[14px]">
          See you at the event!
        </p>
        <p className="mt-3 text-sm text-vv-text-muted">— {ORGANISER}</p>
      </div>
    </main>
  );
}
