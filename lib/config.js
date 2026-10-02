export const EVENT_NAME = "Venture Vault 3.0";
export const ORGANISER = "E-Cell RBU";

// false = the whole site is replaced by the "Registrations are closed" screen
// (components/RegistrationsClosed.jsx) and /api/register refuses every
// submission. Flip back to true to reopen — the form code is untouched.
export const REGISTRATIONS_OPEN = false;

export const GAMES = ["Reel Marketing", "Baggage Battle", "Monopoly"];

// Confirmed list — see docs/FORM_SPEC.md. "Other" stays last; picking it
// reveals a free-text box (see components/PersonFields.jsx).
export const BRANCHES = [
  "Computer Science & Engineering",
  "Computer Science & Engineering (SAP)",
  "BCA",
  "Electrical Engineering",
  "Electronics & Computer Science",
  "Electronics & Communication Engineering",
  "Robotics & Artificial Intelligence",
  "Civil Engineering",
  "Mechanical Engineering",
  "BBA",
  "Other",
];

// Empty string hides the WhatsApp block on the success screen.
export const WHATSAPP_INVITE_LINK =
  "https://chat.whatsapp.com/CNasbl8U88iGlVXXGbnoVC?s=cl&p=i&mlu=0&ilr=4";
