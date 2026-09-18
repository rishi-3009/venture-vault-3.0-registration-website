# Architecture

## File structure

Create files at these paths. Claude Code should follow this layout exactly so
paths in the other docs stay accurate.

```
venture-vault/
├── CLAUDE.md
├── .env.local                 ← secrets, gitignored, never commit
├── .gitignore
├── package.json
├── next.config.mjs
├── tailwind.config.js
│
├── app/
│   ├── layout.js              ← <html>, fonts, metadata
│   ├── page.js                ← the one page; assembles all sections
│   ├── globals.css            ← Tailwind + CSS custom properties
│   └── api/
│       └── register/
│           └── route.js       ← serverless function; the ONLY thing that
│                                 knows where data goes
│
├── components/
│   ├── Hero.jsx               ← scroll container for the particle sequence
│   ├── ParticleCanvas.jsx     ← the canvas animation itself
│   ├── HeroFallback.jsx       ← static/simple version for weak devices
│   ├── GamesSection.jsx       ← three title-only cards
│   ├── RegistrationForm.jsx   ← step state machine, owns all form data
│   ├── FormStep.jsx           ← wrapper: card shell, Next/Back, progress
│   ├── PersonFields.jsx       ← name/branch/email/phone — reused 4×
│   ├── ReviewStep.jsx         ← read-back before submit
│   └── SuccessScreen.jsx      ← post-submission
│
├── lib/
│   ├── config.js              ← event name, games, branch list, WhatsApp link
│   ├── validation.js          ← pure validation functions
│   └── draftStorage.js        ← localStorage save/load/clear
│
└── public/
    ├── ecell-logo.png         ← transparent PNG for particle targets
    └── og-image.jpg           ← link preview image
```

---

## Why the code is split this way

**`PersonFields.jsx` exists because the same four fields appear four times.**
Writing them once and reusing them means a fix to the phone validation fixes it
in all four places. This is the single most important structural decision here.

**`RegistrationForm.jsx` owns all the data.** Individual steps don't hold their
own state — they receive values and a change handler from the parent. This is
"lifting state up," and it's what makes the review step and draft-saving possible:
one object holds everything.

**`lib/` holds logic with no UI.** Validation functions take a string and return
valid/invalid. They don't know React exists. This makes them easy to reason about
and easy to reuse on the server.

**`app/api/register/route.js` is the seam.** It's the only file that knows data
goes to Apps Script. Swapping backends later means rewriting one file.

---

## How data flows

```
User types in a step
   ↓
RegistrationForm holds it in one formData object
   ↓
Every change → saved to localStorage (so a refresh doesn't lose it)
   ↓
User taps Next → that step's fields validated → advance or show errors
   ↓
Review step → user confirms → taps Submit
   ↓
POST /api/register  (browser → your own Vercel function)
   ↓
Server re-validates everything  ← client validation is a convenience, not security
   ↓
Server POSTs to Apps Script URL from process.env.APPS_SCRIPT_URL
   ↓
Apps Script takes a lock, checks for duplicates, appends a row
   ↓
Response travels back up
   ↓
Success → clear the draft, show SuccessScreen
Failure → keep the draft, show error, let them retry
```

**Validate on both sides.** The browser check gives instant feedback. The server
check is the one that actually protects the Sheet — anyone can bypass the browser.

---

## The form's step machine

`RegistrationForm` holds a `currentStep` number.

| Step | Screen | Fields |
|---|---|---|
| 0 | Team Name | teamName |
| 1 | Team Leader | name, branch, email, phone |
| 2 | Member 1 | name, branch, email, phone |
| 3 | Member 2 | name, branch, email, phone |
| 4 | Member 3 | name, branch, email, phone |
| 5 | Review | read-only summary, edit links |
| 6 | Success | confirmation |

Rules:

- Next is blocked until the current step validates. Show errors on the attempted
  tap, not while they're mid-typing.
- Back never validates and never loses data.
- Step 6 is terminal — no going back, and the draft is cleared.
- Show progress as "Step 2 of 6" plus a bar. On mobile, people need to know how
  much is left or they abandon.

---

## Shape of the data object

One flat object, easy to save and send:

```js
{
  teamName: "",
  leader:  { name: "", branch: "", email: "", phone: "" },
  member1: { name: "", branch: "", email: "", phone: "" },
  member2: { name: "", branch: "", email: "", phone: "" },
  member3: { name: "", branch: "", email: "", phone: "" }
}
```

`PersonFields` receives one of these person objects plus a path prefix, so the
same component drives all four.

---

## Rendering model

Next.js renders on the server by default. Anything using `useState`,
`useEffect`, `window`, or `localStorage` must start with `'use client'` on line 1.

Client components here: `RegistrationForm`, `FormStep`, `PersonFields`,
`ReviewStep`, `ParticleCanvas`, `Hero`.

Server components: `layout.js`, `GamesSection` (static content).

Keep `page.js` a server component that imports the client ones. Only the
interactive parts ship as JavaScript to the phone.

---

## Failure handling

| Failure | Behaviour |
|---|---|
| Canvas/WebGL unsupported | Render `HeroFallback`. Page below unaffected. |
| Animation JS throws | Error boundary around Hero only. Form still works. |
| Network dies mid-submit | Error message, draft preserved, Retry button. |
| Apps Script down | Server returns a clear error, not a raw 500 dump. |
| Duplicate detected | Specific message naming what clashed. |
| User refreshes mid-form | Draft restored, returns to the step they were on. |

**Principle: the animation can fail freely. The form may not.** They are wired so
that no failure in the hero can prevent a submission.
