# Deploying to Vercel

Free. About 15 minutes the first time, then every future deploy is automatic.

**Do this early** — on day 1 or 2, not on the 20th. A site that works locally can
fail in production for boring reasons, and you want to discover those with days
to spare.

---

## How it works

```
Your computer → git push → GitHub → Vercel builds it → live URL
```

Vercel watches your GitHub repository. Every push triggers a rebuild and a
redeploy. You never manually upload anything.

---

## Step 1 — Put the code on GitHub

Create an account at https://github.com if you don't have one.

Then create a repository: **+ → New repository**
- Name: `venture-vault`
- **Private** (there's no reason for this to be public)
- **Don't** tick "Add a README" — your project already has files, and adding one
  creates a conflict you'd then have to resolve

GitHub shows you commands. From your project folder:

```bash
git remote add origin https://github.com/YOUR-USERNAME/venture-vault.git
git branch -M main
git push -u origin main
```

- `git remote add origin ...` — tells Git where the online copy lives
- `git branch -M main` — names your branch `main`
- `git push -u origin main` — uploads it

GitHub will ask you to sign in. Use a browser login or a personal access token if
prompted — not your account password, which no longer works for this.

**Before pushing, confirm `.env.local` is NOT in the file list.** Run `git status`.
If `.env.local` appears, stop and fix `.gitignore` first. Secrets pushed to GitHub
are effectively public forever, even if you delete them afterwards.

---

## Step 2 — Connect Vercel

1. Go to https://vercel.com and **Sign up with GitHub**. This links the accounts
   automatically.
2. Click **Add New → Project**.
3. Find `venture-vault` in the list and click **Import**.
4. Vercel detects Next.js and fills in the build settings. **Change nothing.**

---

## Step 3 — Environment variables

**Do this before the first deploy**, on the import screen. Expand
**Environment Variables** and add:

| Name | Value |
|---|---|
| `APPS_SCRIPT_URL` | your `https://script.google.com/macros/s/.../exec` URL |
| `APPS_SCRIPT_SECRET` | the same random string you put in Script Properties |

Apply each to **all three environments** (Production, Preview, Development).

These are the same values as your `.env.local`. That file lives only on your
computer — Vercel's servers have never seen it.

---

## Step 4 — Deploy

Click **Deploy**. Two to three minutes.

You get a URL like `venture-vault-abc123.vercel.app`. That's live on the public
internet right now.

---

## Step 5 — Test the deployed site properly

**Local success does not imply production success.** Environment variables, build
optimisations, and server rendering all behave differently.

Open the URL **on your phone, on mobile data, not wifi** — that's the real
registration condition.

- [ ] Page loads and looks right
- [ ] The hero animation runs (or falls back cleanly)
- [ ] Complete a full registration with team name `TEST-PROD-001`
- [ ] The row appears in the Google Sheet
- [ ] Try submitting it again — duplicate rejection works
- [ ] Refresh mid-form — draft restores
- [ ] Turn off data mid-submit — error shows, data isn't lost

If submissions fail in production but worked locally, it's almost always the
environment variables. Vercel → Project → Settings → Environment Variables.
**After changing them you must redeploy** — Deployments → ⋯ → Redeploy. They're
baked in at build time.

---

## Step 6 — Give it a decent URL

`venture-vault-abc123.vercel.app` is ugly on a poster.

**Free option:** Settings → Domains → add `venturevault-rbu.vercel.app` (any
unclaimed `.vercel.app` subdomain).

**Paid option:** a real `.com` costs ~₹800/year. Out of scope for a ₹0 budget, but
if E-Cell already owns a domain, you can point a subdomain at Vercel for free.

---

## Ongoing deploys

Every change:

```bash
git add .
git commit -m "describe what changed"
git push
```

Vercel rebuilds automatically in ~2 minutes. Watch the build log in the Vercel
dashboard — if the build fails, the error is there, and the previous version stays
live in the meantime. **A failed build cannot take down your working site.**

---

## Free tier limits

| Limit | Free | You need |
|---|---|---|
| Bandwidth | 100 GB/month | well under 1 GB |
| Function invocations | 100k/month | ~500 |
| Function duration | 100 GB-hrs | negligible |
| Builds | 6,000 min/month | ~2 min each |

You will not get near these. The free tier does not auto-upgrade to paid — if you
somehow exceeded it, the site would be limited, not silently billed.

---

## Rolling back

If you push something broken: Vercel → Deployments → find the last good one →
⋯ → **Promote to Production**. Live again in seconds.

This is a genuinely good safety net. It means pushing changes close to the
deadline isn't as risky as it feels.

---

## Before you share the link

- [ ] All `TEST-` rows deleted from the Sheet
- [ ] Event name correct (3.0 vs 4.0 — **confirm this**)
- [ ] Game names correct: Reel Marketing, Baggage Battle, Monopoly
- [ ] No leftover references to 2.0 or last year's guests
- [ ] WhatsApp link preview looks right
- [ ] Tested on at least two different phones
- [ ] Sheet shared with the organising team
- [ ] Someone other than you has completed a test registration start to finish
