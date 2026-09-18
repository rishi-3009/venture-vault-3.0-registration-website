# Setup — getting the project running on your computer

Written for someone who has never set up a Node project. Follow it in order.
Nothing here costs money.

---

## What you're installing and why

- **Node.js** — the program that runs JavaScript outside a browser. Next.js needs it.
- **npm** — comes with Node. It downloads code packages other people wrote.
- **Git** — tracks changes to your files and is how code gets to Vercel.
- **VS Code** — the editor. You probably have it already.

---

## Step 1 — Install Node.js

Go to https://nodejs.org and download the **LTS** version (LTS = Long Term
Support = the stable one). Run the installer, accept the defaults.

Check it worked. Open a terminal:

- **Windows:** press Start, type `cmd`, hit Enter
- **Mac:** press Cmd+Space, type `terminal`, hit Enter
- **VS Code:** Terminal menu → New Terminal

Type this and press Enter:

```bash
node --version
```

You should see something like `v22.11.0`. Any version starting with 20, 22, or
higher is fine. If you get "command not found," restart your terminal — installers
often need that before the change takes effect.

---

## Step 2 — Install Git

Download from https://git-scm.com/downloads and install with defaults.

Verify:

```bash
git --version
```

Then tell Git who you are (it stamps this on every change you save):

```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

---

## Step 3 — Create the Next.js project

Navigate to wherever you keep projects. `cd` means "change directory":

```bash
cd Desktop
```

Now create the project:

```bash
npx create-next-app@latest venture-vault
```

`npx` downloads and runs a tool without permanently installing it.
`create-next-app` is the official Next.js project generator.

It will ask you a series of questions. **Answer them exactly like this:**

| Question | Answer |
|---|---|
| Would you like to use TypeScript? | **No** |
| Would you like to use ESLint? | **Yes** |
| Would you like to use Tailwind CSS? | **Yes** |
| Would you like your code inside a `src/` directory? | **No** |
| Would you like to use App Router? | **Yes** |
| Would you like to use Turbopack? | **Yes** |
| Would you like to customize the import alias? | **No** |

These answers match what every other doc in this folder assumes. Different
answers mean different file paths and the instructions will stop matching.

---

## Step 4 — Open it and run it

```bash
cd venture-vault
code .
```

`code .` opens the current folder in VS Code. If it doesn't work, just open VS
Code and use File → Open Folder.

Now start the development server:

```bash
npm run dev
```

You'll see something like `Local: http://localhost:3000`. Open that in your
browser. You should see the default Next.js welcome page.

**What "dev server" means:** a program that rebuilds your site every time you save
a file, so you see changes instantly. It only runs on your computer — nobody else
can see it.

**To stop it:** click the terminal and press `Ctrl+C`.

Leave it running while you work. Open a *second* terminal tab for other commands.

---

## Step 5 — Save your first version with Git

`create-next-app` already set up Git. Save a snapshot:

```bash
git add .
git commit -m "Initial Next.js setup"
```

- `git add .` — stage every changed file ("." means everything here)
- `git commit -m "..."` — save a snapshot with a note describing it

Commit often, roughly whenever something works. Each commit is a point you can
return to if you break something later.

---

## Step 6 — Environment variables

Secrets don't go in your code. They go in a file Git ignores.

Create a file called **`.env.local`** in the project root (same level as
`package.json`). Put this in it for now:

```
APPS_SCRIPT_URL=
```

You'll fill in the value in `GOOGLE_SHEETS_SETUP.md`.

**Critical:** open `.gitignore` and confirm it contains `.env*`. It should by
default. This is what stops your secrets ending up on GitHub.

Restart the dev server after changing `.env.local` — Next.js only reads it at
startup.

---

## Step 7 — Testing on your actual phone

Do this early. The whole site is mobile-first and your laptop will lie to you.

With the dev server running, find your computer's local IP:

- **Windows:** `ipconfig` — look for "IPv4 Address"
- **Mac:** `ipconfig getifaddr en0`

You'll get something like `192.168.1.7`. On your phone, connected to **the same
wifi**, open:

```
http://192.168.1.7:3000
```

If it doesn't load, your computer's firewall is probably blocking it — allow Node
through, or use `npm run dev -- -H 0.0.0.0`.

---

## Common problems

**"npm is not recognized"** — Node didn't install properly or the terminal is
stale. Restart the terminal, then reinstall Node if needed.

**"Port 3000 is already in use"** — a dev server is already running somewhere.
Find the old terminal and Ctrl+C it, or run `npm run dev -- -p 3001`.

**Changes aren't showing up** — hard refresh (Ctrl+Shift+R / Cmd+Shift+R). If the
dev server printed an error, read it; it's usually a typo with a line number.

**`node_modules` is enormous** — that's normal, it's thousands of dependency
files. It's gitignored and never gets committed.
