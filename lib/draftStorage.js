// Saves the in-progress form to localStorage so a refresh doesn't lose it.
// Every call is wrapped in try/catch — private browsing modes throw on
// localStorage access, and that must never take the whole form down.

const DRAFT_KEY = "vv3_registration_draft";

export function saveDraft(formData, currentStep) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ formData, currentStep }));
  } catch {
    // Storage unavailable (private browsing, quota, etc.) — silently skip.
  }
}

export function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !parsed.formData) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Nothing to do if this throws — the draft just outlives this session.
  }
}
