"use client";

import { PERSON_KEYS, PERSON_LABELS } from "@/lib/validation";

// STEP_FOR_PERSON maps each person key to the step index Edit should jump
// back to — step 0 is team name, 1-4 are leader/member1-3 in that order.
const STEP_FOR_PERSON = { leader: 1, member1: 2, member2: 3, member3: 4 };

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-vv-text-muted">{label}</span>
      <span className="text-right text-vv-text">{value || "—"}</span>
    </div>
  );
}

function Group({ title, onEdit, children, error }) {
  return (
    <div className="rounded-xl border border-vv-border bg-vv-surface-2 p-4">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-vv-text">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-sm font-medium text-vv-amber underline-offset-2 hover:underline"
        >
          Edit
        </button>
      </div>
      {children}
      {error ? <p className="mt-1.5 text-[13px] text-vv-error">{error}</p> : null}
    </div>
  );
}

export default function ReviewStep({ formData, duplicateErrors, onEdit }) {
  return (
    <div className="flex flex-col gap-4">
      <Group title="Team" onEdit={() => onEdit(0)}>
        <Row label="Team Name" value={formData.teamName} />
      </Group>

      {PERSON_KEYS.map((key) => {
        const person = formData[key];
        const branch = person.branch === "Other" ? person.branchOther : person.branch;
        const personErrors = duplicateErrors?.[key];
        const error = personErrors ? Object.values(personErrors).join(" ") : null;

        return (
          <Group key={key} title={PERSON_LABELS[key]} onEdit={() => onEdit(STEP_FOR_PERSON[key])} error={error}>
            <Row label="Name" value={person.name} />
            <Row label="Branch" value={branch} />
            <Row label="Email" value={person.email} />
            <Row label="Phone" value={person.phone} />
          </Group>
        );
      })}

      <p className="text-[13px] text-vv-text-muted">
        Please check carefully — you won&apos;t be able to edit after submitting.
      </p>
    </div>
  );
}
