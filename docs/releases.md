# Release Notes

## v1.1.0 (Current)

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
