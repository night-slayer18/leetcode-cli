# Release Notes

## v1.2.0 (Current)

> **Release Date**: 2026-01-05
> **Focus**: Developer Experience & Type Safety.

### 🔧 Improvements

#### Dynamic Help Text
- Each command now shows contextual examples with `--help`.
- Login shows step-by-step cookie instructions.
- Commands show ID vs. slug usage, custom testcase syntax, etc.

#### Editor Utility Refactor
- Moved `openInEditor` to dedicated `src/utils/editor.ts` utility.
- Uses `open` npm package for robust cross-platform file opening.
- Better support for VS Code family, terminal editors, and GUI editors.

#### Type Safety: Zod Validation
- Added Zod schemas in `src/schemas/api.ts` for all LeetCode API responses.
- Validates data at the API "edge" to catch issues early.
- Prevents "undefined" errors deep in application logic.

---

## v1.1.0

> **Release Date**: 2026-01-04
> **Focus**: Feature Completion and Docker.

### 🚀 New Features

#### Random Problem Picker (`leetcode random`)
- Fetch a random LeetCode problem instantly.
- Filter by difficulty (`-d`) and tag (`-t`).
- Options to auto-generate file (`--pick`) or skip opening (`--no-open`).

#### Past Submissions Viewer (`leetcode submissions`)
- View your last 20 submissions.
- Retrieve code from the last accepted submission (`--last` or `--download`).

#### Docker Support 🐳
- Official Docker image available at `nightslayer/leetcode-cli`.
- Run the CLI without Node.js installation.

#### Documentation Site 📚
- Comprehensive guides hosted on GitHub Pages.

---

## v1.0.1

### 🐛 Bug Fixes
- **Premium Problem Handling**: Fixed a crash when attempting to `show` or `pick` Premium-only problems.

---

## v1.0.0

### 🎉 Initial Release
- Core commands: `list`, `show`, `pick`, `test`, `submit`.
- Cookie-based authentication.
