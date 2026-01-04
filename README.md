# leetcode-cli

A modern, feature-rich LeetCode CLI built with TypeScript.

[![CI](https://github.com/night-slayer18/leetcode-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/night-slayer18/leetcode-cli/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@night-slayer18/leetcode-cli.svg)](https://www.npmjs.com/package/@night-slayer18/leetcode-cli)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## Features

- 🔐 **Cookie-based authentication** - Secure login using browser cookies
- 📋 **List problems** - Filter by difficulty, status, tags, and search
- 📖 **Beautiful problem display** - Formatted output with examples and constraints
- 📝 **Generate solution files** - Auto-organized by difficulty and category
- 🧪 **Test solutions** - Run against sample test cases
- 📤 **Submit solutions** - Submit directly to LeetCode
- 📊 **View statistics** - Track your progress
- 🎯 **Daily challenge** - Get today's problem
- ⚙️ **Configurable** - Set language, editor, and working directory
- 📂 **Smart file discovery** - Use problem ID, filename, or full path

## Installation

```bash
npm install -g @night-slayer18/leetcode-cli
```

## Quick Start

```bash
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

## Commands

| Command | Description |
|---------|-------------|
| `login` | Login with LeetCode browser cookies |
| `logout` | Clear stored credentials |
| `whoami` | Check login status |
| `list` | List problems with filters |
| `show <id>` | Display problem description |
| `daily` | Show today's challenge |
| `pick <id>` | Generate solution file |
| `test <id\|file>` | Test solution against sample cases |
| `submit <id\|file>` | Submit solution to LeetCode |
| `stat [username]` | Show user statistics |
| `config` | View or set configuration |

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

### Pick Problem

```bash
# Generate solution file (uses default language)
leetcode pick 1

# Specify language
leetcode pick 1 --lang python3

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
```

### Configuration

```bash
# View current config
leetcode config

# Interactive setup
leetcode config -i

# Set specific options
leetcode config --lang python3
leetcode config --editor code
leetcode config --workdir ~/leetcode
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

| Language | Extension |
|----------|-----------|
| TypeScript | `.ts` |
| JavaScript | `.js` |
| Python3 | `.py` |
| Java | `.java` |
| C++ | `.cpp` |
| C | `.c` |
| C# | `.cs` |
| Go | `.go` |
| Rust | `.rs` |
| Kotlin | `.kt` |
| Swift | `.swift` |

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
    "workDir": "/path/to/leetcode"
  }
}
```

## Requirements

- Node.js >= 20.0.0

## License

Apache-2.0 © [night-slayer18](https://github.com/night-slayer18)
