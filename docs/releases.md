# Release Notes

## v2.2.2

> **Release Date**: 2026-01-18
> **Focus**: Critical Bug Fix (Update Command)

### 🐛 Bug Fixes

- **Update Command**: Fixed a logic inversion where `leetcode update` would incorrectly report "You're on the latest version" even when updates were available. It now correctly prompts for updates.

---

## v2.2.1

> **Release Date**: 2026-01-17
> **Focus**: Security Hotfix & CI/CD Enhancements

### 🔒 Security Fixes

- **HTML Injection**: Fixed vulnerabilities in problem descriptions, hints, and code templates by replacing regex-based sanitization with `striptags` (#security).
- **Double Escaping**: Fixed issue where HTML entities (like `&quot;`) could be double-unescaped (#security).
- **Dependencies**: Updated CodeQL actions to v4 and added Dependency Review workflow.

### 🔧 Improvements

- **CI/CD**: Added Stale issue management and optimized Docker builds with caching.
- **Linting**: Resolved all ESLint warnings and enforced stricter type safety.

---

## v2.2.0

> **Release Date**: 2026-01-17
> **Focus**: Problem Hints & Performance

### 🚀 New Features

#### Hint Command (`leetcode hint`)

Get hints for a problem when you're stuck.

- `leetcode hint <id>` - Show hints one at a time (press Enter for next)
- `leetcode hint <id> --all` - Show all hints at once
- Supports both problem ID and slug
- Cleans HTML formatting for terminal display
- Alias: `h`

### ⚡ Performance Improvements

#### Submission Polling Optimization

- **Exponential backoff**: Reduced API calls by 60% (30 → 12 calls)
- **Faster results**: 500ms initial delay for quicker feedback
- **Network resilience**: Added retry logic for transient network errors
- **Better error messages**: "Test" vs "Submission" context in timeouts

---

## v2.1.1

> **Release Date**: 2026-01-17
> **Focus**: Refactoring & Robustness

### 🔧 Improvements

- **Code Refactoring**: Extracted shared semver utility for consistent version comparison
- **Improved Parsing**: Enhanced changelog parser regex to handle various version formats
- **Robustness**: Integration tests now verify against real npm/GitHub APIs
- **Network Reliability**: Fixed potential hangs by enforcing strict 10s total timeout for registry checks

---

## v2.1.0

> **Release Date**: 2026-01-16
> **Focus**: CLI Updates & Changelog

### 🚀 New Features

#### Update Command (`leetcode update`)

Check for CLI updates from npm registry with automatic update notifications.

- Visual notification box when updates are available
- Detects breaking changes (major version bumps) and warns users
- 24-hour caching to avoid excessive registry calls
- `--force` flag to bypass cache and re-check

#### Changelog Command (`leetcode changelog`)

View release notes directly from the CLI.

- Fetches changelog from GitHub (works for global installs)
- Default: shows only versions newer than your installed version
- `--all` - Show full changelog
- `--latest` - Show only latest version
- `--breaking` - Filter to breaking changes only
- Enhanced terminal display with emojis and formatting

#### Startup Update Notifications

Non-blocking check on startup shows a subtle banner if updates are available.

### ⚡ Performance Improvements

- Build minification enabled: bundle size reduced ~40% (163KB → 98KB)
- Tree-shaking for better dead code elimination

---

## v2.0.1

> **Release Date**: 2026-01-12
> **Focus**: Security Hotfix

### 🔒 Security Fixes

- **Path Traversal Prevention**: Fixed vulnerability where `test`, `submit`, and `diff --file` commands accepted file paths outside the configured workspace. Now validates that files are inside `workDir` before reading/submitting.
- **Command Injection Prevention**: Fixed `sync` command to sanitize repository names, validate git URLs, and properly escape shell arguments to prevent command injection attacks.

---

## v2.0.0

> **Release Date**: 2026-01-11
> **Focus**: Workspaces, Visual Debugging, Snapshots & Diff

### ⚠️ Breaking Change

This release introduces workspace-aware storage. Existing data in `~/.leetcode/` will not be automatically migrated. Delete the folder to start fresh with the new workspace system or manually move the data to the new workspace directory.

### 🚀 New Features

#### Workspaces (`leetcode workspace`)

Isolate your problem-solving contexts with separate config, timer history, and snapshots.

- `workspace current` - Show active workspace
- `workspace list` - List all workspaces
- `workspace create <name>` - Create new workspace
- `workspace use <name>` - Switch workspaces
- `workspace delete <name>` - Delete workspace

#### Solution Snapshots (`leetcode snapshot`)

Save, restore, and compare different versions of your solutions. Supports save/list/restore/diff/delete operations with auto-backup on restore.

#### Solution Diff (`leetcode diff`)

Compare your current solution with past submissions or files. Shows both solutions with line numbers, or use `--unified` for line-by-line diff.

#### Visual Debugging (`leetcode test --visualize`)

ASCII visualization for test outputs based on problem tags.

- Supports: Array, Linked List, Tree, Binary Tree, Graph, Matrix, String, Stack, Queue, Heap
- Highlights mismatches in red
- Auto-detects 2D arrays as matrices

### 🏗️ Architecture Improvements

- **Workspace-aware storage**: Config, timer, collab, and snapshots are now isolated per-workspace

### 🧪 Testing Improvements

- Comprehensive test suite with 194 tests
- Integration tests for CLI binary verification
- Multi-workspace isolation tests
- Visual debugging unit tests

### 🐛 Bug Fixes

- Fixed command help text alignment
- Fixed empty stdout display

---

## v1.6.0

> **Release Date**: 2026-01-10
> **Focus**: Collaborative Coding & Storage Improvements

### 🚀 New Features

#### Collaborative Coding (`leetcode collab`)

- **Pair Programming**: Solve problems together with a partner.
- **Room System**: Host creates a room, partner joins with a 6-character code.
- **Code Sync**: Upload solutions to the cloud for comparison.
- **Solution Compare**: View both solutions with line numbers.
- **Status Tracking**: See who has synced their code.

### 🏗️ Architecture Improvements

- **Separated Storage**: Config, credentials, collab, and timer data now stored in separate files (`~/.leetcode/`) for cleaner organization.

---

## v1.5.0

> **Release Date**: 2026-01-09
> **Focus**: Interview Timer & Bug Fixes

### 🚀 New Features

#### Interview Timer (`leetcode timer`)

- **Interview Mode**: Start problems with a countdown timer to simulate interview pressure.
- **Default Limits**: Easy (20 min), Medium (40 min), Hard (60 min).
- **Custom Time**: Use `-m <minutes>` for custom time limits.
- **Time Tracking**: Records your solve time when you submit successfully.
- **Statistics**: View your historical solve times with `--stats`.

### 🐛 Bug Fixes

- **File Search**: Fixed issue where `leetcode submit <id>` would find notes files instead of solution files. Now correctly skips hidden directories (`.notes`) and only matches valid code files.

---

## v1.4.0

> **Release Date**: 2026-01-08
> **Focus**: Advanced Statistics & Git Sync

### 🚀 New Features

#### Advanced Statistics (`leetcode stat`)

- **`-c, --calendar`**: Weekly activity summary showing submissions and active days for the last 12 weeks.
- **`-s, --skills`**: Skill breakdown by topic tags (Fundamental/Intermediate/Advanced).
- **`-t, --trend`**: Daily trend bar chart showing submissions for the last 7 days.

#### Automated Git Sync (`leetcode sync`)

- **One-Command Sync**: Automatically commit and push all your solutions to a Git repository.
- **Smart Initialization**: Detects if your folder is a git repo; if not, handles `git init` for you.
- **GitHub Integration**: If you have `gh` CLI installed, auto-creates private repositories on GitHub.
- **Improved Commit Messages**: Commits include file count and a clean timestamp.

### ⚙️ Configuration

- **Repo URL**: New `-r, --repo <url>` option in `config` command.
- **Unset Repo**: You can now clear the repo URL by leaving it blank in interactive mode or passing an empty string.

---

## v1.3.2

> **Release Date**: 2026-01-06
> **Focus**: Critical Hotfix.

### 🐛 Bug Fixes

- **CLI Execution**: Fixed missing shebang (`#!/usr/bin/env node`) that prevented global CLI execution on Unix-like systems.

---

## v1.3.1

> **Release Date**: 2026-01-06
> **Focus**: Bug Fixes & Code Quality.
> **Warning**: This release has a broken binary on Unix/Linux/macOS due to missing shebang.

### 🐛 Bug Fixes

#### API & Polling

- Fixed redundant conditional in `pollSubmission()` - both branches were identical.

#### Premium Problem Handling

- Refactored `pick.ts` premium problem flow for clearer control with explicit branches.
- Now shows helpful message when language not available in code snippets.

#### File Search Safety

- Added depth limiting (max 5 levels) to recursive file searches to prevent runaway traversal.

#### Type Safety

- Fixed nullable types in `ProblemDetail` interface to match Zod schema validation.
- Fixed type assertion order in `config.ts` - now validates before casting.
- Added parseInt validation in `submissions.ts` before API calls.

#### Code Cleanup

- Consolidated duplicate `isProblemId`/`validateProblemId` functions.
- Removed unused `config` imports from `daily.ts` and `show.ts`.

#### Documentation

- Updated Docker alias commands with shell-specific variations (Bash/Zsh, Fish, PowerShell).

---

## v1.3.0

> **Release Date**: 2026-01-06
> **Focus**: Productivity & Code Quality.

### 🚀 New Features

#### Productivity Boosters

- **Today's Progress**: New `today` command shows streak, daily challenge, and solved stats.
- **Bookmarks**: Save interesting problems with `bookmark add/list/remove`.
- **Problem Notes**: Keep personal notes for problems using `note <id>`.
- **Batch Pick**: Pick multiple problems at once with `pick-batch`.

### 🔧 Improvements

#### Code Quality & Robustness

- **Validation**: Strict input validation for problem IDs in `bookmark` and `note` commands.
- **Error Handling**: Improved error reporting for batch operations and API failures.
- **Refactored Utilities**: Extracted shared logic for file finding and validation.
- **Better UX**: Improved spinner messages and premium problem feedback.
- **Resilience**: Added session auto-validation to detect expired cookies.
- **Security**: Enforced global authentication checks across all commands.

---

## v1.2.0

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
