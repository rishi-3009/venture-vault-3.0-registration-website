"use client";

import { BRANCHES } from "@/lib/config";

function ErrorText({ id, message }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 flex items-center gap-1.5 text-[13px] text-vv-error">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        <path d="M12 8v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="16" r="1" fill="currentColor" />
      </svg>
      {message}
    </p>
  );
}

const inputClass = (hasError) =>
  `h-[52px] w-full rounded-xl border bg-vv-surface-2 px-4 text-[16px] text-vv-text outline-none transition-colors duration-150 placeholder:text-vv-text-faint focus:border-vv-amber focus:shadow-[0_0_0_3px_rgba(245,166,35,0.15)] ${
    hasError ? "border-vv-error" : "border-vv-border"
  }`;

// The leader fills all four fields (name/branch/email/phone). Members 2-4
// only fill name + email — see docs/FORM_SPEC.md. `showBranchAndPhone`
// switches those two blocks off for a member step. `prefix` namespaces the
// input ids/names (e.g. "leader", "member2") so labels stay associated with
// the right field even though this component renders across different steps.
export default function PersonFields({ prefix, person, errors, onChange, autoFocus, showBranchAndPhone = true }) {
  const field = (name) => `${prefix}-${name}`;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label htmlFor={field("name")} className="mb-1.5 block text-sm text-vv-text-muted">
          Full Name
        </label>
        <input
          id={field("name")}
          name="name"
          type="text"
          autoComplete="name"
          autoCapitalize="words"
          autoFocus={autoFocus}
          value={person.name}
          onChange={(e) => onChange("name", e.target.value)}
          aria-describedby={errors.name ? field("name-error") : undefined}
          className={inputClass(Boolean(errors.name))}
        />
        <ErrorText id={field("name-error")} message={errors.name} />
      </div>

      {showBranchAndPhone ? (
        <div>
          <label htmlFor={field("branch")} className="mb-1.5 block text-sm text-vv-text-muted">
            Branch / Programme
          </label>
          <select
            id={field("branch")}
            name="branch"
            value={person.branch}
            onChange={(e) => onChange("branch", e.target.value)}
            aria-describedby={errors.branch ? field("branch-error") : undefined}
            className={`${inputClass(Boolean(errors.branch))} appearance-none`}
          >
            <option value="">Select your branch</option>
            {BRANCHES.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
          <ErrorText id={field("branch-error")} message={errors.branch} />

          {person.branch === "Other" ? (
            <div className="mt-3">
              <label htmlFor={field("branch-other")} className="mb-1.5 block text-sm text-vv-text-muted">
                Type your branch
              </label>
              <input
                id={field("branch-other")}
                name="branchOther"
                type="text"
                value={person.branchOther}
                onChange={(e) => onChange("branchOther", e.target.value)}
                className={inputClass(false)}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <div>
        <label htmlFor={field("email")} className="mb-1.5 block text-sm text-vv-text-muted">
          RBU Email
        </label>
        <input
          id={field("email")}
          name="email"
          type="email"
          inputMode="email"
          autoCapitalize="off"
          autoCorrect="off"
          placeholder="you@rbunagpur.in"
          value={person.email}
          onChange={(e) => onChange("email", e.target.value)}
          aria-describedby={errors.email ? field("email-error") : undefined}
          className={inputClass(Boolean(errors.email))}
        />
        <ErrorText id={field("email-error")} message={errors.email} />
      </div>

      {showBranchAndPhone ? (
        <div>
          <label htmlFor={field("phone")} className="mb-1.5 block text-sm text-vv-text-muted">
            Phone Number
          </label>
          <input
            id={field("phone")}
            name="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="98765 43210"
            value={person.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            aria-describedby={errors.phone ? field("phone-error") : undefined}
            className={inputClass(Boolean(errors.phone))}
          />
          <ErrorText id={field("phone-error")} message={errors.phone} />
        </div>
      ) : null}
    </div>
  );
}
