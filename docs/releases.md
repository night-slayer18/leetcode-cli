# Release Notes

## v3.5.1

> **Release Date**: 2026-08-27
> **Focus**: Sync Stats Hotfix — credential loading + API schema fix

### 🐛 Bug Fixes

#### `leetcode sync` always showed "Stats unavailable"

Two root causes were identified and fixed via live API probe:

- **Missing credential loading**: `syncCommand()` called the LeetCode submission API without loading stored session credentials onto the HTTP client. Git authentication (SSH / PAT) is independent of the LeetCode session, so the command could push to GitHub while still being unauthenticated against the LeetCode API. Fixed by calling `setupClientIfLoggedIn()` at the start of `syncCommand()`.

- **Schema type mismatch**: `SubmissionDetailsSchema` declared `runtime` and `memory` as `string`, but the LeetCode API returns them as `number` (raw milliseconds / bytes). Zod rejected every response, causing the `catch` block to fire for every user on every problem, regardless of auth status. Fixed by accepting `number | string` for both fields and making `lang` nullable to handle old submissions.

#### Files changed
- `src/commands/sync.ts` — `setupClientIfLoggedIn()` called at entry
- `src/schemas/api.ts` — `SubmissionDetailsSchema` corrected field types
- `src/types.ts` — `SubmissionDetails` interface updated to match

### 🧪 Testing

- Added `credential loading` test suite (5 tests) to `sync.test.ts`:
  - Verifies `setupClientIfLoggedIn` is called before any API call
  - Verifies auth runs even when there are no changes or work directory is missing
  - Regression test using the exact problem slugs (`valid-parentheses`, `valid-palindrome`) from the original bug report — asserts commit body contains real stats, not "Stats unavailable"
- Total sync tests: 20 (was 15)

---

## v3.5.0

> **Release Date**: 2026-08-14
> **Focus**: TUI Color Themes (Light/Dark/Auto) + LeetCode China Tag Null Fix + CI/CD Workflow Overhaul

### 🚀 Features

#### Color Theme Setting (`leetcode config --theme <dark|light|auto>`)

Added workspace-scoped color theme support for the Terminal UI (TUI) with dark, light, and auto modes.

- **Modes**:
  - `auto` (default): Automatically detects terminal background color by querying the terminal via OSC 11, falling back to `COLORFGBG` or dark mode if the terminal does not respond within 100ms.
  - `dark`: High-contrast dark theme palette tailored for dark terminals.
  - `light`: Clean, readable light theme palette optimized for light terminal backgrounds.
- Configurable via CLI flag: `leetcode config --theme <dark|light|auto>`
- Configurable interactively in the TUI **Config** screen with immediate live palette hot-reloading on save.

```bash
# Pick a color theme for the TUI
leetcode config --theme light
leetcode config --theme dark
leetcode config --theme auto
```

### 🐛 Bug Fixes

#### LeetCode China Null Tag Validation ([#24](https://github.com/night-slayer18/leetcode-cli/issues/24))

- Fixed an `API Response Validation Failed` error when running `show` or `pick` against `leetcode.cn` for problems containing tags without Chinese translations.
- Updated `CnProblemDetailSchema`, `CnProblemListSchema`, and `CnDailyChallengeSchema` Zod definitions to treat `translatedName`, `nameTranslated`, and associated optional metadata as nullable.
- Gracefully falls back to the English tag `name` when Chinese translations are `null`.

### ⚙️ CI/CD & Maintenance

- **Concurrency Controls**: Added concurrency groups with `cancel-in-progress` to PR review and CI workflows to cancel redundant runs on push updates.
- **Manual CI Dispatch**: Added `workflow_dispatch` trigger to the main CI workflow.
- **Security Audit Cleanup**: Removed auto-merge logic from security audit automation workflows.

---

## v3.4.0

> **Release Date**: 2026-07-29
> **Focus**: Contest Navigation + Solution Reset + Zed Editor Support + Security & CI Overhaul

### 🚀 Features

#### Contest Navigation (`leetcode contest [slug]`)

Browse available LeetCode contests and pick contest problems interactively or directly by contest slug.

- Browse global (`leetcode.com`) and China (`leetcode.cn`) contests
- Select contest problems in 1-indexed contest order
- Fully integrated with language selection (`-l/--lang`) and editor launching
- Added shell completions for Fish and Zsh

```bash
leetcode contest                         # Browse contests interactively
leetcode contest weekly-contest-401      # Open contest by slug directly
```

#### Solution Reset (`leetcode reset <id>`)

Restores an existing solution file back to the original LeetCode code stub.

- Automatically detects solution language from file extension
- Safety snapshot backup (`backup-before-reset-<timestamp>`) created before overwriting
- Validates workspace boundaries to prevent unintended file modifications

```bash
leetcode reset 1                         # Reset problem 1 solution
leetcode reset two-sum                   # Reset by problem slug
```

#### Zed Editor Support

Full support for Zed editor (`zed`, `zeditor`, `zed.exe`) across macOS, Linux, and Windows.

```bash
leetcode config --editor zed
```

### 🔒 Security & Maintenance

- Upgraded `eslint` to `v10.8.0` and `@typescript-eslint` packages to `8.65.0`.
- Fixed all 10 high-severity security vulnerabilities reported by `npm audit` (0 vulnerabilities remaining).
- Fixed `auto-label` permission issue on fork PRs (`pull_request_target` event).

---

## v3.3.0

> **Release Date**: 2026-07-07
> **Focus**: Shell Completion + Detailed Sync Stats + CI Overhaul

### 🚀 Features

#### Shell Autocompletion (`leetcode completion`)

New command to generate tab-completion scripts for your shell.

- `leetcode completion zsh` — Zsh completion script
- `leetcode completion bash` — Bash completion script
- `leetcode completion fish` — Fish completion script

Completes commands, subcommands, flags, and valid option values (difficulty, status, language).

**Setup** (Zsh example):
```bash
source <(leetcode completion zsh)   # Add to ~/.zshrc
```

#### Performance Stats in Git Sync Commits

`leetcode sync` now embeds runtime and memory percentile stats in the git commit body for each changed solution file.

Example commit:
```
Sync: 2 solutions - 2026-07-07 10:30:00

- [1. two-sum] Runtime: 0ms (beats 100.00%), Memory: 17.4MB (beats 89.34%)
- [42. trapping-rain-water] Runtime: 3ms (beats 76.21%), Memory: 21.2MB (beats 54.10%)
```

- Fetches the last accepted submission stats from the LeetCode API automatically.
- Gracefully falls back to `Stats unavailable` on network errors.
- Deduplicates API calls when the same problem appears multiple times in the diff.

### 🧪 Testing

- Expanded `sync` test suite from 3 → 15 tests covering all major code paths:
  early exit guards, no-changes path, URL security validation, single/multi solution commits, API call deduplication, non-solution file handling, all API fallback branches, and push failure handling.

---

## v3.2.0


> **Release Date**: 2026-06-28
> **Focus**: Community Engagement + Security

### ⭐ Star Prompt & Command

- New `leetcode star` command — opens the GitHub repo directly.
- Non-intrusive star prompt after accepted submissions:
  - **Milestones**: Shows at 10th, 20th, and 30th accepted submission (one-time each).
  - **Recurring**: After all milestones, shows every 40 accepted submissions.
  - **30-day reset**: Recurring counter resets if 30 days pass without reaching the threshold.
  - **Dismissible**: Choose "Don't ask again" to permanently disable.
  - Falls back to a passive one-liner in non-TTY environments.

### 🔒 Security

- Fixed high-severity dependency vulnerabilities (PR [#12](https://github.com/night-slayer18/leetcode-cli/pull/12)).

### 🧹 Code Quality

- Applied consistent formatting across the entire codebase (line wrapping, argument alignment).

---

## v3.1.0

> **Release Date**: 2026-05-01
> **Focus**: LeetCode China (leetcode.cn) Full Support + Credential UX

### 🌏 LeetCode China Support

- Full `leetcode.cn` integration across CLI and TUI.
- New `LeetCodeSite` type with site utility helpers (`normalizeLeetCodeSiteInput`, `getLeetCodeSiteLabel`).
- GraphQL query packs split into site-specific files (`queries.global.ts`, `queries.cn.ts`) — CN uses the correct native schema for problem list, daily, and problem detail.
- CN-specific Zod schemas for type-safe response parsing.
- CN response adapters that normalize China API responses into the shared CLI data model.
- `LeetCodeClient` is now fully site-aware: switches base URL, query pack, and cookie headers automatically.
- Site selection available in `login`, `config`, and `workspace` commands.
- Site preference persisted per workspace in config file.
- TUI Config screen: site switching with a mandatory confirmation modal that forces an immediate session logout and redirect to login.

### 🔐 Credential & Auth UX

- `leetcode login --help` now documents all three credential storage backends:
  1. **System Keychain** (default) — macOS/Windows/Linux OS-native secure storage via `keytar`.
  2. **Encrypted File** — AES-256-GCM via `LEETCODECLI_CREDENTIAL_BACKEND=file` + `LEETCODECLI_MASTER_KEY`.
  3. **Environment Variables** — read-only headless mode via `LEETCODE_SESSION` + `LEETCODE_CSRF_TOKEN`.
- TUI site switch now correctly wipes the in-memory session (not just persisted config), ensuring users are immediately signed out and redirected to the login screen.

### 🧪 Test Stability

- Mocked `versionStorage` in update/changelog tests to prevent phantom `999.0.0` update cache leakage into real environments.
- Mocked outbound `got` network requests in changelog tests to prevent rate-limit failures in CI.
- All 283 tests pass cleanly across Node 20/22/24 on Ubuntu and macOS.

---

## v3.0.1

> **Release Date**: 2026-04-20
> **Focus**: Submission Parsing Hotfix + Dependency Security Patch

### 🐛 Hotfixes

- Fixed submission-result parsing when LeetCode returns `runtime_percentile` and `memory_percentile` as `null` for non-accepted submissions.
- Prevented false `Submission check failed` schema errors and restored expected wrong-answer style output in CLI/TUI submit flows.
- Added regression coverage for nullable percentile payloads.

### 🔒 Security

- Ran `npm audit fix` and updated transitive dependencies.
- Resolved reported advisories in the dependency graph (`npm audit` now reports `0 vulnerabilities`).

---

## v3.0.0

> **Release Date**: 2026-03-10
> **Focus**: Credential Backend Overhaul (Keychain-First) + Auth Hardening

### ⚠️ Breaking Changes

- Credential persistence model is now backend-driven and no longer reads legacy plaintext `~/.leetcode/credentials.json`.
- Existing users with only legacy plaintext credentials must run `leetcode login` again.
- Default credential backend is now OS keychain (`keytar`).

### 🔐 Security & Auth

- Added deterministic credential backend resolver:
  - `env-readonly` mode when `LEETCODE_SESSION` and `LEETCODE_CSRF_TOKEN` are both set.
  - `keychain` backend by default.
  - Explicit encrypted-file backend via `LEETCODECLI_CREDENTIAL_BACKEND=file` + `LEETCODECLI_MASTER_KEY`.
- Added typed auth storage status/reason handling across CLI and TUI:
  - `ENV_PARTIAL`, `KEYCHAIN_UNAVAILABLE`, `KEYCHAIN_ERROR`, `FILE_MISSING_MASTER_KEY`, `FILE_DECRYPT_FAILED`, `LEGACY_CREDENTIALS_IGNORED`.
- Updated `login`, `logout`, `whoami`, and shared auth checks with consistent remediation messaging.

### ⚙️ Runtime & Platform

- Added Linux keychain prerequisites in CI for deterministic native module builds (`libsecret-1-dev`, `pkg-config`).
- Updated Docker image build/runtime dependencies for keytar compatibility in Linux containers.
- Docker/headless guidance now documents env-readonly auth usage.

### 🧪 Testing

- Added dedicated credential-store tests for resolver precedence, reason states, encrypted file read/write, and legacy-ignore behavior.
- Added CLI and TUI auth tests for env-readonly mode and keychain-unavailable handling.

### 🔧 Additional Merged Fixes

- Included merged PR [#5](https://github.com/night-slayer18/leetcode-cli/pull/5):
  - **Config file write normalization**: `config` writes now include a trailing newline for POSIX-friendly file formatting.

---

## v2.4.1

> **Release Date**: 2026-03-08
> **Focus**: TUI Config Editing Hotfix

### 🐛 Bug Fixes

- **TUI Config Key Hijacking** ([#3](https://github.com/night-slayer18/leetcode-cli/pull/3)): Fixed an issue where global navigation hotkeys (`h`, `l`, `tab`) would intercept keystrokes while editing a config field in the TUI. For example, typing `python3` as the default language would fail because the `h` key triggered a focus-toggle instead of inserting text. The fix ensures that when a config field is in edit mode (`isEditing`), text input takes precedence over all interface hotkeys.

---

## v2.4.0

> **Release Date**: 2026-02-28
> **Focus**: SQL Language Support + Cross-OS CLI E2E Coverage + Sync Security Hardening

### 🚀 Features

- Added `sql` as a first-class supported language for CLI and TUI flows.
- `leetcode config -l sql` and `leetcode pick ... -l sql` are now supported.
- SQL solution files are generated and recognized with `.sql` extension.

### ⚙️ Improvements

- Centralized language normalization and slug resolution logic in a shared utility.
- Added SQL dialect resolution fallback (`mysql` default) for test/submit compatibility.
- Updated config and help surfaces to display SQL as a supported language.
- Replaced shell-interpolated command strings in `sync` with argument-vector execution for dynamic values.
- Updated `git commit -m`, `git remote add origin`, and `gh repo create` dynamic flows to safer `execFileSync(command, args)` usage.

### 🔒 Security

- Resolves CodeQL alert `js/incomplete-sanitization` by removing custom shell-escaping dependence for user/config-derived arguments.

### 🧪 Testing

- Added dedicated SQL language unit tests for mapping, extension detection, and slug resolution.
- Added deterministic cross-OS CLI E2E command-flow tests (config/workspace/snapshot/help) running in Linux/macOS/Windows CI matrix.

---

## v2.3.0

> **Release Date**: 2026-02-11
> **Focus**: TUI Functionality + Stability + Cross-Platform Fixes

### ✅ Compatibility

This is a **minor, non-breaking** release.

- Existing CLI command signatures are unchanged.
- Existing problem action shortcuts remain available in TUI (`p/t/s/h/H/V/b/n/e`).

### 🚀 Highlights

#### TUI Functionality (`leetcode`)

- Running `leetcode` (no args, interactive terminal) launches full-screen TUI mode.
- Problem screen uses a **single-column statement layout** with a **unified bottom drawer** for hints, submissions, snapshots, notes, diff, and status/test/submit output.
- Added focus toggle (`Tab`) between statement body and drawer, with `j/k` and arrows scrolling the focused region.
- Action shortcuts are available in problem view: `p/t/s/h/H/V/b/n/e`.
- Close behavior is consistent: `Esc` closes drawer first, then navigates back.
- Rendering and terminal handling include full-screen redraw and cleanup guards (ANSI reset, cursor/raw-mode restoration) to reduce residue/flicker issues.

#### Cross-Platform Sync Fixes

- Fixed `sync` repository-name extraction on Windows by using `path.basename()` instead of Unix-style path splitting.
- Updated shell argument escaping to use double quotes for better cross-platform behavior.

### 🧪 Quality

- Added dedicated TUI tests for problem-screen drawer routing and state transitions.
- Verified with `npm run typecheck`, `npm run test`, and `npm run build`.

---

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
