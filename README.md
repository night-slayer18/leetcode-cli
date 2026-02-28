# leetcode-cli

A modern, feature-rich LeetCode CLI built with TypeScript.

[![CI](https://github.com/night-slayer18/leetcode-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/night-slayer18/leetcode-cli/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@night-slayer18/leetcode-cli.svg)](https://www.npmjs.com/package/@night-slayer18/leetcode-cli)
[![npm downloads](https://img.shields.io/npm/dm/@night-slayer18/leetcode-cli.svg)](https://www.npmjs.com/package/@night-slayer18/leetcode-cli)
[![node](https://img.shields.io/node/v/@night-slayer18/leetcode-cli.svg)](https://www.npmjs.com/package/@night-slayer18/leetcode-cli)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

<kbd><img src="https://github.com/night-slayer18/leetcode-cli/raw/main/docs/demo.gif"/></kbd>

## Features

- 🔐 **Cookie-based authentication** - Secure login using browser cookies
- 📋 **List problems** - Filter by difficulty, status, tags, and search
- 📖 **Beautiful problem display** - Formatted output with examples and constraints
- 📝 **Generate solution files** - Auto-organized by difficulty and category
- 🧪 **Test solutions** - Run against sample test cases
- 📤 **Submit solutions** - Submit directly to LeetCode
- 📊 **View statistics** - Track your progress
- 🎯 **Daily challenge** - Get today's problem
- ⏱️ **Interview timer** - Timed practice with solve time tracking
- 📸 **Solution snapshots** - Save, restore, and compare solution versions
- 👥 **Collaborative coding** - Solve problems with a partner
- 📁 **Workspaces** - Isolate contexts (interview prep, study, contests)
- ⚙️ **Configurable** - Set language, editor, and working directory
- 🖥️ **Interactive TUI** - Launch full-screen terminal workflow with `leetcode`
- 📂 **Smart file discovery** - Use problem ID, filename, or full path
- 🔄 **Git Sync** - Auto-sync solutions to GitHub/GitLab
- 🚀 **Auto-update notifications** - Get notified when updates are available

## 📚 Documentation

**[View Full Documentation →](https://night-slayer18.github.io/leetcode-cli/)**

**[TUI Guide →](docs/tui.md)**

**[Read the Blog Post →](https://leetcode-cli.hashnode.dev/leetcode-cli)**

## Installation

```bash
npm install -g @night-slayer18/leetcode-cli
```

## Quick Start

```bash
# Launch interactive TUI mode
leetcode

# Login with your LeetCode cookies
leetcode login

# Get today's daily challenge
leetcode daily

# Pick a problem and generate solution file
leetcode pick 1

# Test your solution (any format works!)
leetcode test 1                              # Problem ID
leetcode test 1.two-sum.java                 # Filename
leetcode test ./Easy/Array/1.two-sum.java   # Full path

# Submit your solution
leetcode submit 1
```

## Interactive TUI

Run `leetcode` with no arguments to open the full-screen TUI.

- Works in interactive terminals (TTY).
- Keeps existing command shortcuts for problem actions (`p/t/s/h/H/V/b/n/e`).
- Uses a unified bottom drawer in Problem view for hints, submissions, snapshots, notes, and status output.

See [docs/tui.md](docs/tui.md) for full keybindings and behavior.

## Commands

| Command             | Description                              |
| ------------------- | ---------------------------------------- |
| `login`             | Login with LeetCode browser cookies      |
| `logout`            | Clear stored credentials                 |
| `whoami`            | Check login status                       |
| `today`             | Show daily progress & challenge          |
| `list`              | List problems with filters               |
| `show <id>`         | Display problem description              |
| `hint <id>`         | Show hints for a problem                 |
| `pick <id>`         | Generate solution file                   |
| `pick-batch <ids>`  | Pick multiple problems                   |
| `bookmark <action>` | Manage problem bookmarks                 |
| `note <id>`         | Manage problem notes                     |
| `daily`             | Show today's challenge                   |
| `random`            | Get a random problem                     |
| `test <id\|file>`   | Test solution against sample cases       |
| `submit <id\|file>` | Submit solution to LeetCode              |
| `submissions <id>`  | View past submissions                    |
| `stat [username]`   | Show user statistics                     |
| `timer <id>`        | Interview mode with timer                |
| `snapshot <cmd>`    | Save and restore solution versions       |
| `diff <id>`         | Compare solution with past submissions   |
| `collab <cmd>`      | Collaborative coding with a partner      |
| `workspace <cmd>`   | Manage workspaces for different contexts |
| `config`            | View or set configuration                |
| `sync`              | Sync solutions to Git repository         |
| `update`            | Check for CLI updates                    |
| `changelog`         | View release notes and breaking changes  |

## Usage Examples

### List Problems

```bash
# List all problems
leetcode list

# Filter by difficulty
leetcode list -d easy
leetcode list -d medium
leetcode list -d hard

# Pagination
leetcode list --page 2 -n 10

# Search by keyword
leetcode list -s "binary tree"
```

### Show Problem

```bash
leetcode show 1
leetcode show two-sum
```

### Get Hints

```bash
# Show hints one at a time (press Enter for next)
leetcode hint 1
leetcode hint two-sum

# Show all hints at once
leetcode hint 1 --all
```

### Pick Problem

```bash
# Generate solution file (uses default language)
leetcode pick 1

# Specify language
leetcode pick 1 --lang python3
leetcode pick 175 --lang sql

# Skip opening in editor
leetcode pick 1 --no-open
```

### Test & Submit

All formats work for both `test` and `submit`:

```bash
# Using problem ID (auto-finds the file)
leetcode test 20
leetcode submit 20

# Using filename
leetcode test 20.valid-parentheses.java
leetcode submit 20.valid-parentheses.java

# Using full path
leetcode test ./Easy/String/20.valid-parentheses.java

# With custom test case
leetcode test 20 -c "[1,2,3]\n4"

# Visual debugging (ASCII visualization for arrays, trees, etc.)
leetcode test 1 --visualize
```

### Random Problem

Fetch and solve a random problem.

```bash
# Get random problem
leetcode random

# Filter by difficulty
leetcode random -d hard

# Filter by topic tag
leetcode random -t dp

# Pick immediately
leetcode random -d medium --pick
```

### View & Download Submissions

View past submissions and download code.

```bash
# List last 20 submissions
leetcode submissions 1

# View details of last accepted submission
leetcode submissions 1 --last

# Download last accepted solution
leetcode submissions 1 --download
```

### Productivity Features

```bash
# Show today's progress & challenge
leetcode today

# Pick multiple problems at once
leetcode pick-batch 1 2 3 -l python3

# Bookmark problems
leetcode bookmark add 1
leetcode bookmark list

# Keep personal notes
leetcode note 1 edit
```

### User Statistics

```bash
# Basic stats (solved count, rank, streak)
leetcode stat

# Weekly activity table (last 12 weeks)
leetcode stat -c

# Skill breakdown by topic tags
leetcode stat -s

# 7-day trend chart
leetcode stat -t
```

### Git Integration

```bash
# Sync all solutions to your configured git repo
leetcode sync
```

### Interview Timer

```bash
# Start timer for a problem (default: Easy=20m, Medium=40m, Hard=60m)
leetcode timer 1

# Custom time limit
leetcode timer 1 -m 30

# View your solve time stats
leetcode timer --stats

# Stop active timer
leetcode timer --stop
```

### Collaborative Coding

```bash
# Host a collaboration session
leetcode collab host 1

# Share the room code with your partner
# Partner joins with:
leetcode collab join ABC123

# Both solve the problem, then sync
leetcode collab sync

# Compare solutions
leetcode collab compare

# Check session status
leetcode collab status

# Leave session
leetcode collab leave
```

### Solution Snapshots

```bash
# Save current approach
leetcode snapshot save 1 "brute-force"

# Try a new approach, then save
leetcode snapshot save 1 "hash-map"

# List all saved versions
leetcode snapshot list 1

# Compare approaches
leetcode snapshot diff 1 1 2

# Restore if needed
leetcode snapshot restore 1 brute-force
```

### Compare Solutions

```bash
# Compare with last accepted submission
leetcode diff 1

# Show unified diff (line-by-line changes)
leetcode diff 1 --unified

# Compare with specific submission
leetcode diff 1 --submission 12345

# Compare with local file
leetcode diff 1 --file other-solution.py
```

### Workspaces

Isolate your problem-solving contexts (e.g., interview prep vs daily practice).

```bash
# Show current workspace
leetcode workspace current

# List all workspaces
leetcode workspace list

# Create new workspace
leetcode workspace create interview -w ~/leetcode-interview

# Switch workspace
leetcode workspace use interview

# Delete workspace (files not deleted)
leetcode workspace delete old-workspace
```

Each workspace has its own config, timer history, and solution snapshots.

### Configuration

```bash
# View current config
leetcode config

# Interactive setup
leetcode config -i

# Set specific options
leetcode config --lang python3
leetcode config --lang sql
leetcode config --editor code
leetcode config --workdir ~/leetcode
leetcode config --repo https://github.com/username/leetcode-solutions.git
```

## Folder Structure

Solution files are automatically organized by difficulty and category:

```
leetcode/
├── Easy/
│   ├── Array/
│   │   └── 1.two-sum.java
│   └── String/
│       └── 20.valid-parentheses.java
├── Medium/
│   └── Array/
│       └── 15.3sum.java
└── Hard/
    └── Array/
        └── 4.median-of-two-sorted-arrays.java
```

## Supported Languages

| Language   | Extension |
| ---------- | --------- |
| TypeScript | `.ts`     |
| JavaScript | `.js`     |
| Python3    | `.py`     |
| Java       | `.java`   |
| C++        | `.cpp`    |
| C          | `.c`      |
| C#         | `.cs`     |
| Go         | `.go`     |
| Rust       | `.rs`     |
| Kotlin     | `.kt`     |
| Swift      | `.swift`  |
| SQL        | `.sql`    |

## Authentication

This CLI uses cookie-based authentication. To login:

1. Open [leetcode.com](https://leetcode.com) in your browser
2. Login to your account
3. Open DevTools (F12) → Application → Cookies → leetcode.com
4. Run `leetcode login` and paste your `LEETCODE_SESSION` and `csrftoken` values

## Configuration File

Config is stored at `~/.leetcode/config.json`:

```json
{
  "credentials": {
    "session": "...",
    "csrfToken": "..."
  },
  "config": {
    "language": "java",
    "editor": "code",
    "workDir": "/path/to/leetcode",
    "repo": "https://github.com/username/leetcode-solutions.git"
  }
}
```

## Requirements

- Node.js >= 20.0.0

## Development

```bash
# Clone and install
git clone https://github.com/night-slayer18/leetcode-cli.git
cd leetcode-cli
npm install

# Build
npm run build

# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

See [docs/testing.md](docs/testing.md) for detailed testing documentation.

## Docker Usage

You can run the CLI using Docker without installing Node.js.

### Method 1: Pre-built Image (Recommended)

1. **Pull the image**:

   ```bash
   docker pull nightslayer/leetcode-cli:latest
   ```

2. **Setup Shell Function** (Add to your shell config):

   **Bash/Zsh** (`~/.bashrc` or `~/.zshrc`):

   ```bash
   leetcode() {
     docker run -it --rm \
       -w /root/leetcode \
       -v "$(pwd)/leetcode:/root/leetcode" \
       -v "$HOME/.leetcode:/root/.leetcode" \
       nightslayer/leetcode-cli:latest "$@"
   }
   ```

   **Fish** (`~/.config/fish/config.fish`):

   ```fish
   function leetcode
       docker run -it --rm \
           -w /root/leetcode \
           -v (pwd)/leetcode:/root/leetcode \
           -v $HOME/.leetcode:/root/.leetcode \
           nightslayer/leetcode-cli:latest $argv
   end
   ```

   **PowerShell** (`$PROFILE`):

   ```powershell
   function leetcode {
     docker run -it --rm `
       -w /root/leetcode `
       -v "${PWD}/leetcode:/root/leetcode" `
       -v "$env:USERPROFILE/.leetcode:/root/.leetcode" `
       nightslayer/leetcode-cli:latest $args
   }
   ```

3. **Usage**:
   ```bash
   leetcode list
   leetcode pick 1
   ```

### Method 2: Build Locally

1. **Build the image**:

   ```bash
   docker build -t leetcode-cli .
   ```

2. **Run commands**:
   ```bash
   docker run -it --rm \
     -w /root/leetcode \
     -v "$(pwd)/leetcode:/root/leetcode" \
     -v "$HOME/.leetcode:/root/.leetcode" \
     leetcode-cli list
   ```
   _Note: We mount `~/.leetcode` to persist login credentials and `leetcode` folder to save solution files._

## License

Apache-2.0 © [night-slayer18](https://github.com/night-slayer18)
