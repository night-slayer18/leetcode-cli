# Command Reference

Complete reference for all CLI commands based on actual implementation.

---

## Authentication Commands

### `leetcode login`
Login to LeetCode with browser cookies.

**Usage**: `leetcode login`

---

### `leetcode logout`
Clear stored credentials.

**Usage**: `leetcode logout`

---

### `leetcode whoami`
Check current login status.

**Usage**: `leetcode whoami`

---

## Problem Browsing

### `leetcode list` (alias: `l`)
List LeetCode problems with filtering options.

**Options**:
- `-d, --difficulty <level>` - Filter by difficulty (easy/medium/hard)
- `-s, --status <status>` - Filter by status (todo/solved/attempted)  
- `-t, --tag <tags...>` - Filter by topic tags (can specify multiple)
- `-q, --search <keywords>` - Search by keywords
- `-n, --limit <number>` - Number of problems to show (default: 20)
- `-p, --page <number>` - Page number (default: 1)

**Examples**:
```bash
# List all problems
leetcode list
leetcode l

# List easy problems
leetcode list -d easy
leetcode list --difficulty easy

# List solved problems
leetcode list -s solved
leetcode list --status solved

# Filter by multiple tags
leetcode list -t array string
leetcode list --tag array --tag string

# Search by keyword
leetcode list -q binary
leetcode list --search binary

# Limit results and paginate
leetcode list -n 10
leetcode list --limit 10
leetcode list -p 2
leetcode list --page 2

# Combine multiple filters
leetcode list -d medium -t dp -n 15 -p 1
```

---

### `leetcode show <id>` (alias: `s`)
Show problem description.

**Arguments**:
- `<id>` - Problem ID or slug

**Usage**:
```bash
# By problem ID
leetcode show 1
leetcode s 1

# By slug
leetcode show two-sum
leetcode s two-sum
```

---

### `leetcode daily` (alias: `d`)
Show today's daily challenge.

**Usage**:
```bash
leetcode daily
leetcode d
```

---

### `leetcode random` (alias: `r`)
Get a random problem.

**Options**:
- `-d, --difficulty <level>` - Filter by difficulty (easy/medium/hard)
- `-t, --tag <tag>` - Filter by topic tag
- `--pick` - Auto-generate solution file
- `--no-open` - Do not open file in editor (only with --pick)

**Examples**:
```bash
# Get any random problem
leetcode random
leetcode r

# Get random easy problem
leetcode random -d easy
leetcode random --difficulty easy

# Get random problem with tag
leetcode random -t array
leetcode random --tag array

# Get random and auto-generate file
leetcode random --pick
leetcode random -d hard --pick

# Generate file without opening editor
leetcode random --pick --no-open
leetcode random -d medium -t dp --pick --no-open
```

---

## Solving Problems

### `leetcode pick <id>` (alias: `p`)
Generate solution file for a problem.

**Arguments**:
- `<id>` - Problem ID or slug

**Options**:
- `-l, --lang <language>` - Programming language for the solution
- `--no-open` - Do not open file in editor

**Examples**:
```bash
# Pick by ID (uses default language)
leetcode pick 1
leetcode p 1

# Pick by slug
leetcode pick two-sum
leetcode p two-sum

# Pick with specific language
leetcode pick 1 -l python3
leetcode pick 1 --lang java

# Pick without opening editor
leetcode pick 1 --no-open
leetcode pick 1 -l cpp --no-open
```

---

### `leetcode test <file>` (alias: `t`)
Test solution against sample test cases.

**Arguments**:
- `<file>` - Problem ID, filename, or file path

**Options**:
- `-c, --testcase <testcase>` - Custom test case input

**Three Ways to Test**:
```bash
# Method 1: By problem ID (auto-finds file in workdir)
leetcode test 1
leetcode t 20

# Method 2: By filename (searches in workdir)
leetcode test 1.two-sum.java
leetcode test 20.valid-parentheses.cpp
leetcode t 1.two-sum.py

# Method 3: By file path (relative or absolute)
leetcode test ./Easy/Array/1.two-sum.java
leetcode test /absolute/path/to/solution.py
leetcode t ../problems/1.two-sum.cpp

# With custom test case
leetcode test 1 -c "[1,2,3]\n4"
leetcode test 1 --testcase "[1,2,3]\n4"
```

---

### `leetcode submit <file>` (alias: `x`)
Submit solution to LeetCode.

**Arguments**:
- `<file>` - Problem ID, filename, or file path

**Three Ways to Submit**:
```bash
# Method 1: By problem ID (auto-finds file in workdir)
leetcode submit 1
leetcode x 20

# Method 2: By filename (searches in workdir)
leetcode submit 1.two-sum.java
leetcode submit 20.valid-parentheses.cpp
leetcode x 1.two-sum.py

# Method 3: By file path (relative or absolute)
leetcode submit ./Easy/Array/1.two-sum.java
leetcode submit /absolute/path/to/solution.py
leetcode x ../problems/1.two-sum.cpp
```

**Note**: The CLI auto-detects the problem from the filename format: `{id}.{title-slug}.{ext}`

---

## Submission History

### `leetcode submissions <id>`
View past submissions for a problem.

**Arguments**:
- `<id>` - Problem ID or slug

**Options**:
- `-n, --limit <number>` - Number of submissions to show (default: 20)
- `--last` - Show details of the last accepted submission
- `--download` - Download the last accepted submission code

**Examples**:
```bash
# View last 20 submissions
leetcode submissions 1
leetcode submissions two-sum

# View last 10 submissions
leetcode submissions 1 -n 10
leetcode submissions 1 --limit 10

# Show last accepted submission details
leetcode submissions 1 --last

# Download last accepted submission
leetcode submissions 1 --download

# Combine options
leetcode submissions 1 --last --download
```

---

## User Statistics

### `leetcode stat [username]`
Show user statistics and analytics.

**Arguments**:
- `[username]` - Optional username (defaults to logged-in user)

**Options**:
- `-c, --calendar` - Weekly activity summary for the last 12 weeks
- `-s, --skills` - Skill breakdown by topic tags  
- `-t, --trend` - Daily trend chart for the last 7 days

**What each option shows**:

| Option | Description |
|--------|-------------|
| (none) | Basic stats: problems solved by difficulty, rank, streak |
| `-c` | Weekly table showing submissions count and active days per week for 12 weeks |
| `-s` | Problems solved grouped by tags (Fundamental/Intermediate/Advanced) - helps identify strong & weak topics |
| `-t` | Bar chart of daily submissions for the past 7 days with day labels |

**Usage**:
```bash
# Show basic stats (solved count, rank, streak)
leetcode stat

# Show another user's stats
leetcode stat john_doe

# Weekly activity table (12 weeks)
leetcode stat -c

# Skill breakdown by topic
leetcode stat -s

# 7-day trend chart
leetcode stat -t
```

---

## Git Integration

### `leetcode sync`
Sync all solutions to your configured Git repository.

**Features**:
- Automatically handles `git init` if the working directory is not a git repo.
- Can create a private GitHub repository automatically if `gh` CLI is installed.
- Commits changes with stats (e.g., "Sync: 5 solutions - 2026-01-07...").
- Pushes to the configured remote.

**Usage**:
```bash
leetcode sync
```

---

## Interview Timer

### `leetcode timer [id]`
Start interview mode with a countdown timer to simulate interview conditions.

**How it works**:
- Starts a timer and opens the problem in your editor
- Default time limits: Easy (20 min), Medium (40 min), Hard (60 min)
- When you submit successfully, your solve time is recorded
- View your historical solve times with `--stats`

**Options**:
- `-m, --minutes <minutes>` - Custom time limit in minutes
- `--stats` - Show solve time statistics
- `--stop` - Stop active timer

**Usage**:
```bash
# Start timer for problem 1 (uses default time based on difficulty)
leetcode timer 1

# Start with custom 30-minute limit
leetcode timer 1 -m 30

# View your solve time statistics
leetcode timer --stats

# Stop active timer (without recording)
leetcode timer --stop
```

---

## Configuration

### `leetcode config`
View or set configuration.

**Options**:
- `-l, --lang <language>` - Set default programming language
- `-e, --editor <editor>` - Set editor command
- `-w, --workdir <path>` - Set working directory for solutions
- `-r, --repo <url>` - Set Git repository URL
- `-i, --interactive` - Interactive configuration mode

**Examples**:
```bash
# View current config
leetcode config

# Set default language
leetcode config -l python3
leetcode config --lang java

# Set editor
leetcode config -e code
leetcode config --editor vim

# Set working directory
leetcode config -w ~/leetcode
leetcode config --workdir /Users/you/projects/leetcode

# Set Git repository
leetcode config -r https://github.com/user/repo.git

# Interactive configuration
leetcode config -i
leetcode config --interactive

# Set multiple options
leetcode config -l cpp -e code -w ~/leetcode
```

---

## Collaborative Coding

### `leetcode collab host <id>`
Host a collaboration session for a problem.

**Usage**: `leetcode collab host <problemId>`

Creates a new collaboration room and generates a unique room code to share with your partner.

**Examples**:
```bash
leetcode collab host 1
# Output: Room Code: ABC123
```

---

### `leetcode collab join <code>`
Join an existing collaboration session.

**Usage**: `leetcode collab join <roomCode>`

**Examples**:
```bash
leetcode collab join ABC123
```

---

### `leetcode collab sync`
Upload your current solution to the collaboration room.

**Usage**: `leetcode collab sync`

Reads your local solution file and syncs it to the cloud so your partner can see it.

---

### `leetcode collab compare`
Compare your solution with your partner's solution.

**Usage**: `leetcode collab compare`

Displays both solutions sequentially with line numbers for easy comparison.

---

### `leetcode collab status`
Check the current collaboration session status.

**Usage**: `leetcode collab status`

Shows room code, problem ID, participants, and sync status.

---

### `leetcode collab leave`
Leave the current collaboration session.

**Usage**: `leetcode collab leave`

If you're the host, the room will be deleted.

---

## Solution Snapshots

### `leetcode snapshot save <id> [name]`
Save current solution as a snapshot.

**Arguments**:
- `<id>` - Problem ID
- `[name]` - Optional snapshot name (defaults to `snapshot-N`)

**Examples**:
```bash
leetcode snapshot save 1 "brute-force"
leetcode snapshot save 1 "hash-map-approach"
leetcode snapshot save 1  # auto-named "snapshot-1"
```

---

### `leetcode snapshot list <id>`
List all snapshots for a problem.

**Arguments**:
- `<id>` - Problem ID

**Example**:
```bash
leetcode snapshot list 1
#   1. brute-force         (15 lines, 5m ago)
#   2. hash-map-approach   (10 lines, just now)
```

---

### `leetcode snapshot restore <id> <snapshot>`
Restore a previously saved snapshot. Auto-creates backup of current code.

**Arguments**:
- `<id>` - Problem ID  
- `<snapshot>` - Snapshot ID or name

**Examples**:
```bash
leetcode snapshot restore 1 1           # By ID
leetcode snapshot restore 1 brute-force # By name
```

---

### `leetcode snapshot diff <id> <snap1> <snap2>`
Compare two snapshots with colored diff output.

**Arguments**:
- `<id>` - Problem ID
- `<snap1>` - First snapshot ID or name
- `<snap2>` - Second snapshot ID or name

**Example**:
```bash
leetcode snapshot diff 1 1 2
# Shows: + added lines, - removed lines, metrics
```

---

### `leetcode snapshot delete <id> <snapshot>`
Delete a snapshot.

**Arguments**:
- `<id>` - Problem ID
- `<snapshot>` - Snapshot ID or name

**Example**:
```bash
leetcode snapshot delete 1 brute-force
```

---

## Global Options

These work with any command:

- `-h, --help` - Display help for command
- `-v, --version` - Output the version number

**Examples**:
```bash
# Get help
leetcode --help
leetcode list --help

# Check version
leetcode --version
leetcode -v
```
