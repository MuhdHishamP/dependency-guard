# 🎬 Dependency Guard — FINAL Hackathon Demo Runsheet

## Target Runtime: **3 min 30 sec**

---

# 🟢 PRE-RECORD CHECK (Do Once)

### 💻 Commands

```bash
# Link the CLI globally (run FROM the project root)
cd ~/Desktop/Dependency_guard
npm run build
npm link

# Clear cache so demos hit the network fresh
rm -rf ~/.dependency-guard/cache/

# Verify it works
dg --version
```

---

# 🔥 STEP 1 — VISUAL HOOK (0:00 → 0:20)

## 🎙 Script

"AI just told me to install these packages."

"Looks smart. Looks safe. But AI doesn't know what's already in your project."

"Watch this."

---

## 💻 Command

```bash
cd ~/Desktop/Dependency_guard/demo-react17-app/
cat package.json
```

Pause 2 sec.

---

## 🎙 Script

"React 17 project."

"My AI suggested React Query."

---

# 🔴 STEP 2 — TENSION: WILL THIS BREAK? (0:20 → 1:00)

## 🎙 Script

"Normally I'd run npm install and hope nothing explodes."

"But I run Dependency Guard first."

---

## 💻 Command

```bash
dg check @tanstack/react-query
```

---

## 🎙 Script (While spinner runs)

"It's checking peer dependencies, security advisories, and package health."

---

## 🎙 Script (After output)

"Boom. React Query needs React 18+. I'm on 17."

"This would have broken my app."

"And look — it gives me a copy-paste fix command right there."

Pause 2 sec on the risk score box.

---

# 🟢 STEP 3 — RELIEF: SAFE PACKAGE (1:00 → 1:40)

## 🎙 Script

"Now let's check something safe."

---

## 💻 Command

```bash
dg check zod
```

---

## 🎙 Script

"No peer conflicts. No security flags. Actively maintained."

"Green light. Safe to install."

Pause.

---

# 🔴 STEP 4 — CREDIBILITY: DEPRECATED PACKAGE (1:40 → 2:20)

## 🎙 Script

"Now let's check something older that AI still sometimes suggests."

---

## 💻 Command

```bash
dg check request
```

---

## 🎙 Script

"Deprecated."

"This is exactly the kind of thing that slips into projects during fast AI-driven development."

Pause.

---

# 🟣 STEP 5 — SCALE: PROJECT LEVEL CHECK (2:20 → 2:55)

## 🎙 Script

"You can also scan an entire project at once."

---

## 💻 Command

```bash
cd ~/Desktop/Dependency_guard/demo-full-project/
dg check-file package.json
```

---

## 🎙 Script

"It validates every dependency — compatibility, security, risk — in one sweep."

"Perfect for pre-commit hooks and CI pipelines."

---

# 🟡 STEP 6 — AUTHORITY MOMENT: CI MODE (2:55 → 3:20)

## 🎙 Script

"You can even fail CI if something risky appears."

---

## 💻 Command

```bash
dg check fake-nonexistent-pkg-xyz; echo "Exit code: $?"
```

---

## 🎙 Script

"If it blocks, CI fails. No risky dependencies reach production."

---

# 🟢 STEP 7 — STRONG CLOSE (3:20 → 3:40)

## 🎙 Script

"One command. Before npm install."

"Built for how we build today — fast, AI-assisted, and production-focused."

"Dependency Guard."

"Because the best bug is the one you never ship."

---

# 🧾 PRACTICE CHEAT SHEET (Correct Paths)

```bash
# Pre-record setup
cd ~/Desktop/Dependency_guard && npm run build && npm link
rm -rf ~/.dependency-guard/cache/

# Demo flow
cd ~/Desktop/Dependency_guard/demo-react17-app/
cat package.json

dg check @tanstack/react-query
dg check zod
dg check request

cd ~/Desktop/Dependency_guard/demo-full-project/
dg check-file package.json

dg check fake-nonexistent-pkg-xyz; echo "Exit code: $?"
```

---

# 🎯 PERFORMANCE NOTES

### 🎬 Energy Curve

Start calm → build tension → celebrate catch → relax → finish authoritative

### ⏱ Pacing Rule

Let results sit on screen **2 seconds minimum**

### 🎤 Voice Tone

| Step | Tone |
|------|------|
| Hook | Curious, slightly amused |
| Catch moment | Excited — "boom" energy |
| Safe moment | Confident, relaxed |
| Deprecated | Knowing, "see?" energy |
| CI moment | Serious, professional |
| Close | Calm + strong |

### 🖥 Terminal Setup

```bash
# Clean prompt for recording
export PS1="\[\033[1;36m\]demo\[\033[0m\] \[\033[1;33m\]→\[\033[0m\] "
```

- Font size: **18–20px**
- Theme: Dark (Dracula / One Dark)
- Width: ~100 columns
