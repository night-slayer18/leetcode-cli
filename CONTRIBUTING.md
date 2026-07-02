# Contributing to leetcode-cli

Thank you for taking the time to contribute! This guide will help you get started.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Commit Messages](#commit-messages)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Running Tests](#running-tests)
- [Reporting Issues](#reporting-issues)

---

## Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/leetcode-cli.git
   cd leetcode-cli
   ```
3. Add the upstream remote so you can keep your fork in sync:
   ```bash
   git remote add upstream https://github.com/night-slayer18/leetcode-cli.git
   ```

---

## Development Setup

**Requirements**: Node.js ≥ 20 and npm.

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Type check
npm run typecheck

# Lint
npm run lint
```

For a live rebuild during development:
```bash
npm run dev
```

---

## Making Changes

1. **Sync with upstream** before branching:
   ```bash
   git checkout dev
   git pull upstream dev
   ```

2. **Create a branch** from `dev` (not `main`):
   ```bash
   git checkout -b feat/my-feature
   ```
   > All PRs should target the `dev` branch. `main` is release-only.

3. Make your changes, then **verify everything passes**:
   ```bash
   npm run typecheck
   npm run lint
   npm run build
   npm test
   ```

4. **Push** your branch and open a PR against `dev`.

---

## Commit Messages

We follow the **[Conventional Commits](https://www.conventionalcommits.org/)** specification. This keeps the changelog clean and makes it easy to understand what changed and why.

**Format:**
```
<type>(<optional scope>): <short description>

<optional body>
```

**Types:**

| Type | When to use |
|------|-------------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation changes only |
| `test` | Adding or updating tests |
| `refactor` | Code change that is neither a fix nor a feature |
| `style` | Formatting, whitespace (no logic change) |
| `chore` | Build process, tooling, dependency updates |
| `ci` | CI/CD workflow changes |
| `perf` | Performance improvements |

**Examples:**
```bash
feat(tui): add dark mode toggle to config screen
fix(submit): handle null percentile from leetcode API
docs: update installation instructions for Windows
test(star-prompt): add coverage for 30-day reset window
chore: bump got to v14
```

> **Note on signing commits**: We recommend signing commits with GPG (`git commit -s`) as a good practice,
> but it is **not required**. Please don't let that stop you from contributing.

---

## Pull Request Guidelines

### Title

Your PR title must follow the same Conventional Commits format:
```
feat: add random problem filter by topic tag
fix(login): handle expired session gracefully
```

An automated check will validate this and fail if the format is incorrect.

### Description

Please include in your PR description:
- **What** the change does
- **Why** it is needed (link to an issue if applicable)
- **How** to test it manually (if applicable)

Empty PR descriptions are not accepted.

### Checklist

Before submitting, make sure:

- [ ] Tests pass locally (`npm test`)
- [ ] Type check passes (`npm run typecheck`)
- [ ] Lint passes (`npm run lint`)
- [ ] New features include tests
- [ ] Documentation is updated if needed
- [ ] PR targets the `dev` branch (not `main`)

### PR Size

Keep PRs focused. A PR that does one thing well is much easier to review than one that does five.
If your change is large, consider breaking it into smaller PRs.

---

## Running Tests

```bash
# Run all tests
npm test

# Run a specific test file
npx vitest run src/__tests__/commands/submit.test.ts

# Watch mode during development
npm run test:watch
```

When adding a new feature, please add tests. When fixing a bug, add a test that would have caught it.

---

## Reporting Issues

When filing a bug report, please include:

1. **CLI version** (`leetcode --version`)
2. **Operating system and version**
3. **Node.js version** (`node --version`)
4. **Steps to reproduce** the issue
5. **Expected** vs **actual** behaviour
6. Any **error output** from the terminal

For feature requests, describe the use case and what problem it solves for you.

---

## Questions?

Feel free to open a [Discussion](https://github.com/night-slayer18/leetcode-cli/discussions) if you have questions that don't fit an issue.

Thank you for contributing! ⭐
