"use client";

// The card shell every step sits inside: progress bar, heading, the step's
// own fields as children, then Back/Next. Individual steps never render
// their own card or buttons — that's what keeps every step visually
// consistent for free.
export default function FormStep({
  step,
  totalSteps,
  title,
  subtitle,
  children,
  onNext,
  onBack,
  nextLabel = "Next",
  showBack = true,
  isSubmitting = false,
  submittingHint,
  footerError,
}) {
  const progressPct = ((step + 1) / totalSteps) * 100;

  return (
    <div className="mx-auto w-full max-w-[480px] rounded-[20px] border border-vv-border bg-vv-surface p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] md:p-8">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs text-vv-text-muted">
          <span>
            Step {step + 1} of {totalSteps}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden bg-vv-surface-2">
          <div
            className="h-full bg-vv-amber transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <h2 className="font-pixel text-[14px] leading-[1.6] text-vv-text uppercase md:text-[17px]">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-1 text-sm text-vv-text-muted">{subtitle}</p>
      ) : null}

      <div className="mt-6">{children}</div>

      {footerError ? (
        <p
          role="alert"
          className="mt-6 rounded-lg border border-vv-error/40 bg-vv-error/10 px-3 py-2 text-[13px] text-vv-error"
        >
          {footerError}
        </p>
      ) : null}

      <div className="mt-8 flex gap-3">
        {showBack ? (
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="h-[52px] flex-1 border-[3px] border-vv-border bg-transparent font-pixel text-[11px] text-vv-text-muted uppercase transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Back
          </button>
        ) : null}
        <button
          type="button"
          onClick={onNext}
          disabled={isSubmitting}
          className="qblock-button h-[52px] flex-[2] px-2 font-pixel text-[11px] leading-[1.6] text-[#3a1400] uppercase disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? "Loading..." : nextLabel}
        </button>
      </div>

      {isSubmitting && submittingHint ? (
        <p className="mt-3 text-center text-[13px] text-vv-text-faint">{submittingHint}</p>
      ) : null}
    </div>
  );
}
