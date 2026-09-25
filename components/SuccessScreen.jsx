"use client";

import { WHATSAPP_INVITE_LINK } from "@/lib/config";

export default function SuccessScreen({ teamName, teamId }) {
  return (
    <div className="mx-auto w-full max-w-[480px] rounded-[20px] border border-vv-border bg-vv-surface p-6 text-center shadow-[0_8px_32px_rgba(0,0,0,0.4)] md:p-8">
      <p className="font-pixel text-[20px] leading-[1.5] text-[#cb4f1b] md:text-[26px]">COURSE CLEAR!</p>
      <h2 className="mt-4 font-pixel text-[14px] leading-[1.6] text-vv-text uppercase md:text-[17px]">
        You&apos;re registered!
      </h2>
      <p className="mt-2 text-sm text-vv-text-muted">
        Team &ldquo;{teamName}&rdquo; is confirmed for Venture Vault 3.0.
      </p>

      {teamId ? (
        // The one thing they must keep — so it gets its own box and the
        // biggest text on the screen.
        <div className="mt-5 border-[3px] border-vv-amber bg-vv-surface-2 px-4 py-5">
          <p className="font-pixel text-[12px] text-vv-text-muted uppercase">Team ID</p>
          <p className="mt-3 font-pixel text-[44px] leading-none text-vv-amber md:text-[56px]">{teamId}</p>
          <p className="mt-4 text-sm font-semibold text-vv-text">Take a screenshot and remember this.</p>
        </div>
      ) : null}

      {WHATSAPP_INVITE_LINK ? (
        <div className="mt-6 border-t border-vv-border pt-6">
          <p className="mb-3 text-sm text-vv-text-muted">
            One last step — every registered member must join the WhatsApp
            group for event updates.
          </p>
          <a
            href={WHATSAPP_INVITE_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="qblock-button inline-flex min-h-[52px] w-full items-center justify-center px-3 py-2 font-pixel text-[11px] leading-[1.6] text-[#3a1400] uppercase"
          >
            Join WhatsApp Group (Required)
          </a>
        </div>
      ) : null}
    </div>
  );
}
