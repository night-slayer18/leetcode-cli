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
Show user statistics.

**Arguments**:
- `[username]` - Optional username (defaults to logged-in user)

**Usage**:
```bash
# Show your own stats
leetcode stat

# Show another user's stats
leetcode stat john_doe
```

---

## Configuration

### `leetcode config`
View or set configuration.

**Options**:
- `-l, --lang <language>` - Set default programming language
- `-e, --editor <editor>` - Set editor command
- `-w, --workdir <path>` - Set working directory for solutions
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

# Interactive configuration
leetcode config -i
leetcode config --interactive

# Set multiple options
leetcode config -l cpp -e code -w ~/leetcode
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
