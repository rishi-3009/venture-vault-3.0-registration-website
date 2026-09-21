"use client";

import { WHATSAPP_INVITE_LINK } from "@/lib/config";

export default function SuccessScreen({ teamName, teamId }) {
  return (
    <div className="mx-auto w-full max-w-[480px] rounded-[20px] border border-vv-border bg-vv-surface p-6 text-center shadow-[0_8px_32px_rgba(0,0,0,0.4)] md:p-8">
      <div className="text-4xl">🎉</div>
      <h2 className="mt-4 text-[20px] font-semibold text-vv-text md:text-[24px]">
        You&apos;re registered!
      </h2>
      <p className="mt-2 text-sm text-vv-text-muted">
        Team &ldquo;{teamName}&rdquo; is confirmed for Venture Vault 3.0.
      </p>

      {teamId ? (
        <div className="mt-3">
          <p className="text-sm text-vv-text-muted">
            Your Team ID: <span className="font-semibold text-vv-amber">{teamId}</span> — remember this.
          </p>
          <p className="mt-1 text-[13px] text-vv-text-faint">Take a screenshot.</p>
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
            className="inline-flex h-[52px] w-full items-center justify-center rounded-xl bg-vv-amber font-semibold text-vv-black transition-colors duration-150 hover:bg-vv-amber-bright"
          >
            Join WhatsApp Group (Required)
          </a>
        </div>
      ) : null}
    </div>
  );
}
