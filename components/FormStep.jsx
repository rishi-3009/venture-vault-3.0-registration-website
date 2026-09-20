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
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-vv-surface-2">
          <div
            className="h-full rounded-full bg-vv-amber transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <h2 className="text-[20px] font-semibold leading-[1.3] text-vv-text md:text-[24px]">
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
            className="h-[52px] flex-1 rounded-xl border border-vv-border bg-transparent font-medium text-vv-text-muted transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Back
          </button>
        ) : null}
        <button
          type="button"
          onClick={onNext}
          disabled={isSubmitting}
          className="h-[52px] flex-[2] rounded-xl bg-vv-amber font-semibold text-vv-black transition-all duration-150 hover:bg-vv-amber-bright active:scale-[0.98] active:bg-vv-amber-deep disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? "Submitting…" : nextLabel}
        </button>
      </div>
    </div>
  );
}
