# Command Reference

## `leetcode list`
Listing problems with advanced filtering.

**Aliases**: `ls`
**Options**:
- `-d, --difficulty <level>`: Easy, Medium, Hard.
- `-s, --status <status>`: ac (solved), todo.
- `-t, --tag <tag>`: Filter by tag (e.g. array, dp).
- `-q, --query <keyword>`: Search by name.
- `-p, --page <num>`: Page number.
- `-n, --limit <num>`: Items per page (default 20).

**Examples**:
```bash
leetcode list -d easy -n 10
leetcode list -t "dynamic-programming"
leetcode list -s ac
```

## `leetcode show`
Display problem details.

**Usage**: `leetcode show <id|slug>`
**Examples**:
```bash
leetcode show 1
leetcode show two-sum
```

## `leetcode pick`
Generate a solution file in your workspace.

**Usage**: `leetcode pick <id|slug>`
**Options**:
- `-l, --lang <ext>`: Override default language.
- `--no-open`: Do not open in editor.

**Examples**:
```bash
leetcode pick 1
leetcode pick 1 -l py
```

## `leetcode test`
Run your solution against sample test cases.

**Usage**: `leetcode test <id|file>`
**Examples**:
```bash
leetcode test 1
leetcode test ./Easy/Array/1.two-sum.java
```

## `leetcode submit`
Submit your solution to LeetCode.

**Usage**: `leetcode submit <id|file>`
**Examples**:
```bash
leetcode submit 1
```

## `leetcode random`
Get a random problem.

**Options**:
- `-d <diff>`: Difficulty.
- `-t <tag>`: Tag.
- `--pick`: Auto-generate file.
- `--no-open`: Skip opening editor.

**Examples**:
```bash
leetcode random -d hard
```

## `leetcode daily`
Get today's daily challenge.

## `leetcode submissions`
View past submissions.

**Usage**: `leetcode submissions <id|slug>`
**Options**:
- `-n <limit>`: Number of submissions (default 20).
- `--last`: Show code of last accepted.
- `--download`: Download last accepted code.
