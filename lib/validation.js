// Pure validation functions — no React, no DOM. Each returns an error
// message string, or null when the value is valid. Kept dependency-free so
// the same functions can run again on the server later without changes.

export function validateTeamName(value) {
  const trimmed = (value || "").trim();
  if (!trimmed) return "Team name is required.";
  if (trimmed.length < 2) return "Team name must be at least 2 characters.";
  if (trimmed.length > 40) return "Team name must be 40 characters or fewer.";
  if (!/^[a-zA-Z0-9\s'-]+$/.test(trimmed)) {
    return "Team name can only use letters, numbers, spaces and hyphens.";
  }
  return null;
}

export function normalizeTeamName(value) {
  return (value || "").trim().replace(/\s+/g, " ");
}

export function validatePersonName(value) {
  const trimmed = (value || "").trim();
  if (!trimmed) return "Name is required.";
  if (/\d/.test(trimmed)) return "Name can't contain numbers.";
  if (trimmed.length < 2) return "Please enter a full name.";
  if (trimmed.length > 50) return "Please enter a full name.";
  if (!/^[a-zA-Z\s'.-]+$/.test(trimmed)) return "Please enter a full name.";
  return null;
}

export function validateBranch(branch, branchOther) {
  if (!branch) return "Please select a branch.";
  if (branch === "Other" && !(branchOther || "").trim()) {
    return "Please type your branch.";
  }
  return null;
}

export function normalizeEmail(value) {
  return (value || "").trim().toLowerCase();
}

export function validateEmail(value) {
  const trimmed = (value || "").trim();
  if (!trimmed) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return "That doesn't look like a valid email address.";
  }
  if (!trimmed.toLowerCase().endsWith("@rbunagpur.in")) {
    return "Please use your RBU email address (ending in @rbunagpur.in).";
  }
  return null;
}

// Strips spaces, hyphens, a leading +91/91 country code and a leading 0,
// so "+91 98765-43210" and "098765 43210" both normalise the same way
// people actually type their number.
export function normalizePhone(value) {
  let digits = (value || "").replace(/[\s-]/g, "");
  digits = digits.replace(/^\+?91/, "");
  digits = digits.replace(/^0+/, "");
  return digits;
}

export function validatePhone(value) {
  const digits = normalizePhone(value);
  if (!digits) return "Phone number is required.";
  if (digits.length !== 10) return "Phone number must be exactly 10 digits.";
  if (!/^[6789]/.test(digits)) return "Please enter a valid Indian mobile number.";
  return null;
}

// Every field for one person (leader / member1-3). Returns {field: message}
// only for fields that failed — an empty object means the person is valid.
export function validatePerson(person) {
  const errors = {};
  const name = validatePersonName(person.name);
  if (name) errors.name = name;
  const branch = validateBranch(person.branch, person.branchOther);
  if (branch) errors.branch = branch;
  const email = validateEmail(person.email);
  if (email) errors.email = email;
  const phone = validatePhone(person.phone);
  if (phone) errors.phone = phone;
  return errors;
}

const PERSON_KEYS = ["leader", "member1", "member2", "member3"];
const PERSON_LABELS = {
  leader: "Team Leader",
  member1: "Member 2",
  member2: "Member 3",
  member3: "Member 4",
};

// Cross-checks the 4 people against each other — same rule the server will
// enforce against the whole Sheet, but the within-team half of it needs no
// round trip so it can run instantly at the review step.
export function validateWithinTeamDuplicates(formData) {
  const errors = {};
  const emailSeen = new Map();
  const phoneSeen = new Map();

  for (const key of PERSON_KEYS) {
    const person = formData[key];
    const email = normalizeEmail(person.email);
    const phone = normalizePhone(person.phone);

    if (email) {
      if (emailSeen.has(email)) {
        const otherLabel = PERSON_LABELS[emailSeen.get(email)];
        errors[key] = errors[key] || {};
        errors[key].email = `This email is already used by ${otherLabel}.`;
      } else {
        emailSeen.set(email, key);
      }
    }

    if (phone) {
      if (phoneSeen.has(phone)) {
        const otherLabel = PERSON_LABELS[phoneSeen.get(phone)];
        errors[key] = errors[key] || {};
        errors[key].phone = `This phone number is already used by ${otherLabel}.`;
      } else {
        phoneSeen.set(phone, key);
      }
    }
  }

  return errors;
}

export { PERSON_KEYS, PERSON_LABELS };
