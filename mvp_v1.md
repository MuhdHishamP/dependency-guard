# Dependency Guard — Implementation Plan (v3)

TypeScript ESM CLI that validates npm packages **before** installation — primarily checking **peer dependency compatibility** with the user's `package.json`, plus deprecation, security, and risk scoring.

> [!IMPORTANT]
> **v3 changes:** Jest → Vitest (zero config), `semver.intersects()` for range comparison, `peerDependenciesMeta` for optional peers, copy-paste fix commands, CI exit codes.

---

## Phase 1: Scaffolding & Types *(30 min)*

**Goal:** Compilable project, dev loop works, no config headaches.

#### [NEW] [package.json](file:///home/dell/Desktop/Dependency_guard/package.json)

```json
{
  "type": "module",
  "engines": { "node": ">=18.0.0" },
  "bin": { "dependency-guard": "./dist/index.js" },
  "dependencies": {
    "commander": "^12.0.0",
    "chalk": "^5.3.0",
    "ora": "^8.0.1",
    "node-fetch": "^3.3.2",
    "boxen": "^7.1.1",
    "semver": "^7.6.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/semver": "^7.5.0",
    "typescript": "^5.3.3",
    "tsx": "^4.7.0",
    "vitest": "^1.2.0",
    "eslint": "^8.56.0",
    "prettier": "^3.2.4"
  },
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsc",
    "test": "vitest",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write src/**/*.ts"
  }
}
```

#### [NEW] [tsconfig.json](file:///home/dell/Desktop/Dependency_guard/tsconfig.json)
- `module: "NodeNext"`, `moduleResolution: "NodeNext"`, `target: "ES2022"`, strict

#### [NEW] [.gitignore](file:///home/dell/Desktop/Dependency_guard/.gitignore) / [.eslintrc.json](file:///home/dell/Desktop/Dependency_guard/.eslintrc.json)

> [!NOTE]
> **Removed from v2:** `jest.config.js` (Vitest needs no config), `.nvmrc` (not critical)

#### [NEW] [src/types.ts](file:///home/dell/Desktop/Dependency_guard/src/types.ts)
Key interfaces:
- `PeerCheck` — `{ name, required, installed, status: 'COMPATIBLE'|'INCOMPATIBLE'|'MISSING'|'OPTIONAL_MISSING', fixCommand? }`
- `CompatibilityReport`, `PackageInfo`, `SecurityVulnerability`, `RiskScore`, `ValidationResult`

#### [NEW] [src/index.ts](file:///home/dell/Desktop/Dependency_guard/src/index.ts)
- Shebang `#!/usr/bin/env node` + minimal commander stub

**Verify:** `npm install && npm run build && npm run dev`

---

## Phase 2: Utilities & Config *(30 min)*

#### [NEW] [src/utils/logger.ts](file:///home/dell/Desktop/Dependency_guard/src/utils/logger.ts)
- Chalk + boxen helpers: `logSuccess`, `logWarning`, `logError`, `logInfo`, `renderResultBox`

#### [NEW] [src/utils/cache.ts](file:///home/dell/Desktop/Dependency_guard/src/utils/cache.ts)
- File-based JSON cache at `~/.dependency-guard/cache/`, 24h TTL

#### [NEW] [src/config/alternatives.ts](file:///home/dell/Desktop/Dependency_guard/src/config/alternatives.ts)
- Deprecated → alternatives map (moment, request, etc.)

**Verify:** `npm run build`

---

## Phase 3: Core Checkers *(2–2.5 hr)* ⭐

> [!IMPORTANT]
> This is the critical phase. The compatibility checker is the primary differentiator.

#### [NEW] [src/checkers/compatibility.ts](file:///home/dell/Desktop/Dependency_guard/src/checkers/compatibility.ts) ⭐ PRIMARY

1. `findPackageJson(startPath)` — walk up to 3 dirs to find `package.json`
2. Read user's `dependencies` + `devDependencies` → installed map
3. Fetch target package's `peerDependencies` **and** `peerDependenciesMeta` from npm
4. For each peer dep:
   - **Missing (required)** → status `MISSING`, generate `npm install` fix command
   - **Missing (optional)** → status `OPTIONAL_MISSING`, no fix command
   - **Range mismatch** → `semver.intersects()` → status `INCOMPATIBLE`, generate fix command
   - **Compatible** → status `COMPATIBLE`
5. Graceful fallback: no `package.json` found → return `[]`, don't crash

#### [NEW] [src/checkers/npm.ts](file:///home/dell/Desktop/Dependency_guard/src/checkers/npm.ts)
- Fetch from `registry.npmjs.org`: deprecated, last publish, downloads, maintainers, license

#### [NEW] [src/checkers/security.ts](file:///home/dell/Desktop/Dependency_guard/src/checkers/security.ts)
- Query `api.osv.dev` for CVEs

#### [NEW] [src/checkers/scoring.ts](file:///home/dell/Desktop/Dependency_guard/src/checkers/scoring.ts)
- 0–100 score; **compatibility mismatches carry heaviest weight**
- Returns `ALLOW | WARN | BLOCK`

**Verify:** `npm run build` + manual test with scratch script

---

## Phase 4: Validator & CLI *(1 hr)*

#### [NEW] [src/validator.ts](file:///home/dell/Desktop/Dependency_guard/src/validator.ts)
- `validatePackage(name, projectPath?)` → orchestrates compat → npm → security → scoring

#### [MODIFY] [src/index.ts](file:///home/dell/Desktop/Dependency_guard/src/index.ts)

Commands:
- `check <package>` — validate single package
- `check-file <path>` — scan a `package.json`
- Flags: `--dry-run`, `--no-cache`, `--project-path <dir>`

**Output order** (compatibility first):
```
⚠️  COMPATIBILITY ISSUES:

  ❌ Missing: react-dom
     Required: ^18.0.0
  ⚠️  Incompatible: react
     Required: ^18.0.0
     You have: ^17.0.2

💡 Run this to fix:
  npm install react-dom@"^18.0.0" react@"^18.0.0"

ℹ️  Optional peer dependencies not installed:
  • @types/react: ^18.0.0

Also checked:
✓ Not deprecated
✓ No critical vulnerabilities

Risk Score: 40/100 (WARN)
```

**Exit codes:**
- `BLOCK` → `process.exit(1)` (fails CI)
- `WARN` / `ALLOW` → `process.exit(0)`

**Verify:**
```bash
npm link
dependency-guard check @tanstack/react-query   # peer dep warnings
dependency-guard check react                    # ALLOW
dependency-guard check moment                   # deprecated WARN
dependency-guard check fake-xyz-99              # not found BLOCK
npm unlink -g dependency-guard
```

---

## Phase 5: Testing & Docs *(45 min)*

#### [NEW] [tests/fixtures/](file:///home/dell/Desktop/Dependency_guard/tests/fixtures/)
- Mock npm responses with `peerDependencies` + `peerDependenciesMeta`
- Fake `package.json` files for React 17 / React 18 projects

#### [NEW] [tests/compatibility.test.ts](file:///home/dell/Desktop/Dependency_guard/tests/compatibility.test.ts)
Using Vitest (`describe`, `it`, `expect`, `vi.mock`):
- Incompatible range detected
- Missing required peer detected
- Optional missing peer handled correctly
- No `package.json` → graceful empty result
- Compatible range → `COMPATIBLE`

#### [NEW] [tests/validator.test.ts](file:///home/dell/Desktop/Dependency_guard/tests/validator.test.ts)
- End-to-end: deprecated, safe, CVE, non-existent packages

#### [NEW] [README.md](file:///home/dell/Desktop/Dependency_guard/README.md)
- Hero example: the compatibility workflow, CLI reference

**Verify:** `npm test && npm run lint`

---

## Phase 6: Polish & Ship *(15 min)*

- `npm run lint && npm run format`
- `git init && git add . && git commit -m "feat: dependency-guard v0.1.0"`
- `git tag v0.1.0`
- `npm pack` verification

---

## Summary

| Phase | Focus | Time |
|-------|-------|------|
| 1 | Scaffolding (tsx + vitest, no jest.config) | 30m |
| 2 | Utilities (logger, cache, alternatives) | 30m |
| 3 | **Checkers (compatibility ⭐ + npm + security + scoring)** | 2–2.5h |
| 4 | CLI (copy-paste fixes, exit codes) | 1h |
| 5 | Tests (vitest) + README | 45m |
| 6 | Ship | 15m |
| | **Total** | **~5.5–6h** |
