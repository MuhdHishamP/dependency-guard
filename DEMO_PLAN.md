# 🎬 Dependency Guard — Hackathon Demo Plan & Script

> **Target length:** 3–4 minutes  
> **Format:** Screen recording + voiceover (no face cam needed)  
> **Audience:** Hackathon judges, vibe coders, AI-assisted developers  
> **Vibe:** Energetic but credible. "I built this because I kept getting burned."

---

## 🧠 Core Narrative Arc

```
HOOK (20s)  →  PROBLEM (40s)  →  SOLUTION (30s)  →  LIVE DEMO (90s)  →  CLOSING (20s)
```

The story: **"AI writes your code. But who checks your dependencies?"**

---

## 📋 Pre-Recording Checklist

### Terminal Setup
- [ ] Clean terminal with a dark theme (Dracula / One Dark recommended)
- [ ] Font size bumped to **18–20px** so it's readable on video
- [ ] Terminal width: ~100 columns (not too wide, keeps focus)
- [ ] Clear terminal history (`clear`)

### Project Setup
- [ ] Have TWO project folders ready:
  1. `~/demo-react17-app/` — a fake React 17 project (to show incompatibility)
  2. `~/demo-fresh-app/` — a clean project (to show a clean check)
- [ ] `dependency-guard` globally linked (`npm link`)
- [ ] Clear the DG cache before recording: `rm -rf ~/.dependency-guard/cache/`

### Recording Tools
- [ ] OBS Studio or built-in screen recorder
- [ ] Record at **1920×1080** minimum
- [ ] Record audio separately if possible (cleaner edit)
- [ ] Have a glass of water nearby 😄

### Demo Folder: `~/demo-react17-app/package.json`
```json
{
  "name": "my-vibe-app",
  "version": "1.0.0",
  "dependencies": {
    "react": "^17.0.2",
    "react-dom": "^17.0.2"
  }
}
```

### Demo Folder: `~/demo-fresh-app/package.json`
```json
{
  "name": "fresh-project",
  "version": "1.0.0",
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "next": "^15.0.0"
  }
}
```

---

## 🎙️ Full Voiceover Script

### ACT 1 — THE HOOK (0:00 – 0:20)

> *[Screen: Terminal with the DG logo/banner or just a blank terminal]*

**VOICEOVER:**

> "You're vibe coding. Cursor or Copilot just wrote 200 lines for you. It says *npm install these five packages*. You hit enter. And then..."
>
> *[Screen: Quickly flash a chaotic terminal wall of npm WARN peer dependency errors — use a screenshot or pre-recorded clip]*
>
> "...dependency hell. Peer conflicts. Deprecated packages. Stuff that breaks at 2 AM and you have no idea why."
>
> "What if you could catch all of that... *before* you install?"

---

### ACT 2 — THE PROBLEM (0:20 – 1:00)

> *[Screen: A VS Code / Cursor window with an AI chat suggesting `npm install @tanstack/react-query react-hook-form zod`]*

**VOICEOVER:**

> "Here's the thing about vibe coding — AI is amazing at picking the *right* package for the job. But it has no idea what's already in YOUR `package.json`."
>
> *[Screen: Show a `package.json` with React 17]*
>
> "You're on React 17. The AI suggests React Query v5, which *requires* React 18. You install it. Everything looks fine... until your app silently breaks. Or worse — it works in dev and crashes in production."
>
> "The npm warnings are easy to miss. They scroll past in a wall of text. And by the time you notice, you've already built on top of a broken foundation."
>
> "This is the problem Dependency Guard solves."

---

### ACT 3 — THE SOLUTION (1:00 – 1:30)

> *[Screen: Terminal, clean]*

**VOICEOVER:**

> "Dependency Guard is a CLI that validates any npm package *before* you install it."
>
> "It checks three things:"
>
> *[Screen: Type each one out or show a simple slide/text]*
>
> "**One** — Peer dependency compatibility. Does this package actually work with what you already have?"
>
> "**Two** — Security. Are there any known CVEs for this version?"
>
> "**Three** — Risk scoring. Is this package deprecated? Abandoned? A single-maintainer side project with 12 downloads?"
>
> "And it gives you a clear verdict: **allow**, **warn**, or **block** — with copy-paste fix commands."

---

### ACT 4 — LIVE DEMO (1:30 – 3:00)

#### Demo 1: The Catch — Incompatible Package (1:30 – 2:15)

> *[Screen: `cd ~/demo-react17-app && cat package.json`]*

**VOICEOVER:**

> "Let's see it in action. Here's a typical vibe-coded React 17 project."
>
> *[Screen: Show the package.json with React 17]*
>
> "My AI just told me to install React Query. Let's check it first."

> *[Screen: Type and run]*
> ```bash
> dg check @tanstack/react-query
> ```

> *[Wait for output — the spinner runs, then the report appears]*

**VOICEOVER:**

> "Boom. Right away — **peer dependency issue**. React Query v5 needs React 18 or higher. I'm on 17. That would have broken my app."
>
> *[Point out the output sections]*
>
> "It shows me exactly what's wrong, and — this is the key part — it gives me a **copy-paste command** to fix it. No Googling. No StackOverflow."
>
> "And look at the risk score — it says WARN. It's not going to silently let me shoot myself in the foot."

#### Demo 2: The All-Clear — Safe Package (2:15 – 2:40)

> *[Screen: Type and run]*
> ```bash
> dg check zod
> ```

**VOICEOVER:**

> "Now let's check something safe — Zod, zero peer dependencies, actively maintained, no CVEs."
>
> "Green across the board. Risk score: ALLOW. Go ahead and install it. No drama."

#### Demo 3: The Red Flag — Deprecated Package (2:40 – 3:00)

> *[Screen: Type and run]*
> ```bash
> dg check request
> ```

**VOICEOVER:**

> "One more — what about `request`? The classic HTTP library that your AI might still suggest."
>
> "Deprecated. And Dependency Guard catches it immediately. It even knows about this one from its built-in alternatives list."
>
> "This is the kind of knowledge that experienced devs have in their heads. Dependency Guard puts it in your terminal."

---

### ACT 5 — CLOSING (3:00 – 3:30)

> *[Screen: Terminal or a simple title card]*

**VOICEOVER:**

> "Dependency Guard. One command before `npm install`. That's it."
>
> "It's built in TypeScript, fully open source, and it's designed for the way we code now — fast, AI-assisted, and with confidence."
>
> *[Screen: Show the GitHub URL or a title card]*
>
> "Because the best bug is the one you never ship."
>
> *[Optional: Quick flash of `dg check-file package.json` scanning an entire project]*
>
> "Thanks for watching."

---

## 🎯 Key Demo Commands (Quick Reference)

```bash
# Setup (do this before recording)
cd ~/demo-react17-app
clear

# Demo 1: Catch a peer dep issue
dg check @tanstack/react-query

# Demo 2: Clean check
dg check zod

# Demo 3: Deprecated package
dg check request

# Bonus: Scan entire project
dg check-file package.json

# Bonus: CI mode (show exit code)
dg check fake-nonexistent-pkg-xyz; echo "Exit code: $?"
```

---

## 🎨 Visual Polish Tips

### Make the Terminal Pop
```bash
# Set a clean prompt for the demo
export PS1="\[\033[1;36m\]demo\[\033[0m\] \[\033[1;33m\]→\[\033[0m\] "
```

### Pacing
- **Don't rush.** Let the spinner run. Let the output breathe.
- **Pause for 1–2 seconds** on the risk score box — it's your money shot.
- Type commands at a natural speed (not instant paste).

### Editing Tips
- Cut out any long network delays (>3 seconds) in post.
- Add subtle zoom-ins on key output sections (peer issues, risk score box).
- Background music: lo-fi or ambient electronic, **very low volume** — just enough to fill dead air.

---

## 💡 Talking Points (If You Get Q&A)

1. **"How is this different from `npm install` warnings?"**
   > npm warnings happen *after* install and are buried in noise. We check *before* install and give you actionable fix commands.

2. **"Why not just use `npx depcheck`?"**
   > depcheck analyzes what you've *already* installed. We analyze what you're *about to* install. It's preventive vs. reactive.

3. **"Does it work in CI?"**
   > Yes. `dg check <pkg>` exits with code 1 on BLOCK. You can gate deployments on it.

4. **"What about monorepos?"**
   > Use `--project-path` to point to any `package.json`. Works with any project structure.

5. **"Why does this matter for vibe coders specifically?"**
   > AI suggests packages without context about your project. We bridge that gap — we know your `package.json` and we check compatibility *for* you.

---

## 📁 Deliverables Checklist

- [ ] Demo video (3–4 min, 1080p minimum)
- [ ] GitHub repo clean and public
- [ ] README with clear install/usage instructions
- [ ] At least one GIF/screenshot in the README showing output
- [ ] One-liner pitch ready: *"Validate npm packages before installation — peer compatibility, security, and risk scoring in one command."*
