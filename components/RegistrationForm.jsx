"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import PersonFields from "./PersonFields";
import FormStep from "./FormStep";
import ReviewStep from "./ReviewStep";
import SuccessScreen from "./SuccessScreen";
import {
  validateTeamName,
  normalizeTeamName,
  validatePerson,
  validateMember,
  validateWithinTeamDuplicates,
} from "@/lib/validation";
import { loadDraft, saveDraft, clearDraft } from "@/lib/draftStorage";

const EMPTY_PERSON = { name: "", branch: "", branchOther: "", email: "", phone: "" };

function emptyFormData() {
  return {
    teamName: "",
    leader: { ...EMPTY_PERSON },
    member1: { ...EMPTY_PERSON },
    member2: { ...EMPTY_PERSON },
    member3: { ...EMPTY_PERSON },
  };
}

// Step 0 is the team name, steps 1-4 are the four people, 5 is review, 6 is
// the terminal success screen (not counted in "Step X of 6").
const TOTAL_STEPS = 6;
const PERSON_STEP_KEYS = { 1: "leader", 2: "member1", 3: "member2", 4: "member3" };
const STEP_TITLES = {
  1: "Team Leader",
  2: "Member 2 (Optional)",
  3: "Member 3 (Optional)",
  4: "Member 4 (Optional)",
};

// Reads localStorage exactly once per mount without a hydration mismatch:
// the server (and the client's first hydration pass) always see `null`,
// then useSyncExternalStore lets the real value take over right after —
// same pattern Hero.jsx uses for tier detection, and it sidesteps calling
// setState synchronously inside an effect just to read something on mount.
function createDraftStore() {
  let cached;
  return {
    getSnapshot() {
      if (cached === undefined) cached = loadDraft();
      return cached;
    },
    getServerSnapshot() {
      return null;
    },
    subscribe() {
      return () => {};
    },
  };
}

export default function RegistrationForm() {
  const [formData, setFormData] = useState(emptyFormData);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [duplicateErrors, setDuplicateErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [teamId, setTeamId] = useState(null);
  const [draftStore] = useState(createDraftStore);
  const initialDraft = useSyncExternalStore(
    draftStore.subscribe,
    draftStore.getSnapshot,
    draftStore.getServerSnapshot
  );
  const [draftDismissed, setDraftDismissed] = useState(false);
  const [draftApplied, setDraftApplied] = useState(false);
  const showDraftBanner = Boolean(initialDraft) && !draftDismissed && !draftApplied;
  const saveTimerRef = useRef(null);
  const containerRef = useRef(null);

  // Autosave, debounced ~300ms, skipped once registration is complete.
  useEffect(() => {
    if (step === 6) return;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveDraft(formData, step), 300);
    return () => clearTimeout(saveTimerRef.current);
  }, [formData, step]);

  // After a failed validation, move both focus and the viewport to the
  // first invalid field — mobile users shouldn't have to hunt for it.
  useEffect(() => {
    if (Object.keys(errors).length === 0) return;
    const firstInvalid = containerRef.current?.querySelector(".border-vv-error");
    if (firstInvalid) {
      firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
      firstInvalid.focus?.({ preventScroll: true });
    }
  }, [errors]);

  function acceptDraft() {
    if (initialDraft) {
      setFormData({ ...emptyFormData(), ...initialDraft.formData });
      setStep(initialDraft.currentStep || 0);
    }
    setDraftApplied(true);
  }

  function dismissDraft() {
    setDraftDismissed(true);
  }

  function updatePersonField(personKey, field, value) {
    setFormData((prev) => ({
      ...prev,
      [personKey]: { ...prev[personKey], [field]: value },
    }));
  }

  function handleNext() {
    if (step === 0) {
      const err = validateTeamName(formData.teamName);
      if (err) {
        setErrors({ teamName: err });
        return;
      }
      setFormData((prev) => ({ ...prev, teamName: normalizeTeamName(prev.teamName) }));
      setErrors({});
      setStep(1);
      return;
    }

    if (step >= 1 && step <= 4) {
      const personKey = PERSON_STEP_KEYS[step];
      // The leader (step 1) is always required in full. Members 2-4 are
      // optional — validateMember only complains if the step was touched but
      // left half-done (e.g. a name with no email).
      const personErrors =
        step === 1 ? validatePerson(formData[personKey]) : validateMember(formData[personKey]);
      if (Object.keys(personErrors).length > 0) {
        setErrors(personErrors);
        return;
      }
      setErrors({});
      setStep(step + 1);
      return;
    }

    if (step === 5) {
      const dupes = validateWithinTeamDuplicates(formData);
      if (Object.keys(dupes).length > 0) {
        setDuplicateErrors(dupes);
        return;
      }
      setDuplicateErrors({});
      setSubmitError(null);
      submitRegistration();
    }
  }

  function handleBack() {
    if (step === 0 || isSubmitting) return;
    setErrors({});
    setStep(step - 1);
  }

  // POSTs to our own /api/register route (never straight to Apps Script —
  // see docs/PROJECT_BRIEF.md on why that indirection exists). The draft is
  // deliberately *not* cleared until the server confirms success, so a
  // failed submit — bad connection, Apps Script down, whatever — leaves the
  // user able to just tap Submit again instead of losing their answers.
  async function submitRegistration() {
    setIsSubmitting(true);
    setSubmitError(null);

    let result;
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      result = await response.json();
    } catch {
      setIsSubmitting(false);
      setSubmitError("Couldn't reach the server. Check your connection and try again.");
      return;
    }

    if (!result.ok) {
      setIsSubmitting(false);
      // A cross-team duplicate (checked against the whole Sheet) names which
      // of our own people it clashed on — route it onto the same per-group
      // error display the within-team check already uses, instead of just a
      // generic banner.
      if (result.personKey && result.field) {
        setDuplicateErrors((prev) => ({
          ...prev,
          [result.personKey]: { ...prev[result.personKey], [result.field]: result.error },
        }));
      } else {
        setSubmitError(result.error || "Something went wrong. Please try again.");
      }
      return;
    }

    setIsSubmitting(false);
    setTeamId(result.teamId);
    clearDraft();
    setStep(6);
  }

  if (step === 6) {
    return <SuccessScreen teamName={formData.teamName} teamId={teamId} />;
  }

  return (
    <div ref={containerRef} className="w-full">
      {showDraftBanner ? (
        <div className="mx-auto mb-4 flex w-full max-w-[480px] items-center justify-between gap-3 rounded-xl border border-vv-border bg-vv-surface-2 px-4 py-3 text-sm text-vv-text-muted">
          <span>We saved your progress. Continue where you left off?</span>
          <div className="flex shrink-0 gap-3">
            <button
              type="button"
              onClick={dismissDraft}
              className="text-vv-text-muted underline-offset-2 hover:underline"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={acceptDraft}
              className="font-medium text-vv-amber underline-offset-2 hover:underline"
            >
              Continue
            </button>
          </div>
        </div>
      ) : null}

      {step === 0 && (
        <FormStep step={0} totalSteps={TOTAL_STEPS} title="Let's start with your team" onNext={handleNext} showBack={false}>
          <div>
            <label htmlFor="teamName" className="mb-1.5 block text-sm text-vv-text-muted">
              Team Name
            </label>
            <input
              id="teamName"
              type="text"
              value={formData.teamName}
              onChange={(e) => setFormData((prev) => ({ ...prev, teamName: e.target.value }))}
              aria-describedby={errors.teamName ? "teamName-error" : undefined}
              className={`h-[52px] w-full rounded-xl border bg-vv-surface-2 px-4 text-[16px] text-vv-text outline-none transition-colors duration-150 focus:border-vv-amber focus:shadow-[0_0_0_3px_rgba(245,166,35,0.15)] ${
                errors.teamName ? "border-vv-error" : "border-vv-border"
              }`}
            />
            {errors.teamName ? (
              <p id="teamName-error" role="alert" className="mt-1.5 text-[13px] text-vv-error">
                {errors.teamName}
              </p>
            ) : null}
            <p className="mt-2 text-[13px] text-vv-text-muted">
              Teams can have up to 4 people. Only the leader is required — members 2-4 are optional.
            </p>
          </div>
        </FormStep>
      )}

      {step >= 1 && step <= 4 && (
        <FormStep
          key={step}
          step={step}
          totalSteps={TOTAL_STEPS}
          title={STEP_TITLES[step]}
          subtitle={step === 1 ? "This is who we'll contact about the event" : undefined}
          onNext={handleNext}
          onBack={handleBack}
        >
          <PersonFields
            prefix={PERSON_STEP_KEYS[step]}
            person={formData[PERSON_STEP_KEYS[step]]}
            errors={errors}
            onChange={(field, value) => updatePersonField(PERSON_STEP_KEYS[step], field, value)}
            autoFocus
            showBranchAndPhone={step === 1}
          />
        </FormStep>
      )}

      {step === 5 && (
        <FormStep
          step={5}
          totalSteps={TOTAL_STEPS}
          title="Review"
          onNext={handleNext}
          onBack={handleBack}
          nextLabel="Submit Registration"
          isSubmitting={isSubmitting}
          footerError={submitError}
        >
          <ReviewStep formData={formData} duplicateErrors={duplicateErrors} onEdit={setStep} />
        </FormStep>
      )}
    </div>
  );
}
