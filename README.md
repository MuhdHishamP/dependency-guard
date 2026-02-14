# 🛡️ Dependency Guard

**Validate npm packages BEFORE installation.**

Dependency Guard is a TypeScript CLI tool that helps you avoid "dependency hell" by checking peer dependency compatibility, security vulnerabilities, and maintenance risks before you ever run `npm install`.

## ✨ Features

- **Peer Compatibility ⭐**: Checks if a new package's `peerDependencies` are compatible with your current project's versions.
- **Smart Fixes**: Generates copy-paste commands to install missing or incompatible peer dependencies.
- **Security Audit**: Queries OSV.dev for known vulnerabilities (CVEs) affecting the specific version.
- **Risk Scoring**: Calculates a 0–100 score based on compatibility, security, deprecation, and maintenance.
- **CI Ready**: Returns non-zero exit codes for high-risk packages (customizable with `--dry-run`).

## 🚀 Installation

Link the package locally for development:

```bash
git clone https://github.com/MuhdHishamP/dependency-guard.git
cd dependency-guard
npm install
npm run build
npm link
```

Now you can use the `dg` command anywhere!

## 📖 Usage

### Check a single package
See if `zod` is safe to add to your current project:
```bash
dg check zod
```

### Scan an entire project
Audit all dependencies in a `package.json` file:
```bash
dg check-file package.json
```

### Options
- `--dry-run`: Don't exit with an error code even if the package is high-risk.
- `--no-cache`: Bypass the local cache and fetch fresh data from npm/OSV.
- `--project-path <dir>`: Specify a different directory to look for the local `package.json`.

## 🛠️ Development

- `npm run dev`: Run the CLI directly from source using `tsx`.
- `npm run build`: Compile TypeScript to ESM using `tsup`.
- `npm test`: Run the Vitest test suite.
- `npm run lint`: Check for code style issues.

## 📄 License

MIT
