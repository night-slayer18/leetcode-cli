# Configuration

## Initial Setup

The CLI requires your LeetCode authentication cookies.

1. Login to [leetcode.com](https://leetcode.com).
2. Open Browser DevTools (F12) -> Application -> Cookies.
3. Find `LEETCODE_SESSION` and `csrftoken`.
4. Run:
   ```bash
   leetcode login
   ```
5. Paste the values.

## Config Command

Use `leetcode config` to view or modify settings.

```bash
# View config
leetcode config

# Set Python as default language
leetcode config -l python3

# Set SQL as default language
leetcode config -l sql

# Set default work directory
leetcode config -w ~/Development/my-leetcode

# Set Git repository
leetcode config -r https://github.com/myuser/leetcode-solutions.git
```

## Settings

Config is stored per-workspace in `~/.leetcode/workspaces/<name>/config.json`.

| Key        | Description                                          |
| ---------- | ---------------------------------------------------- |
| `lang`     | Default language extension (java, python3, sql, etc) |
| `editor`   | Command to open files (code, vim, nano)              |
| `workDir`  | Directory where solution files are saved             |
| `syncRepo` | Remote Git repository URL                            |

## Workspace-Aware Storage

Settings are now stored per-workspace for isolation:

| Data        | Storage Location                            | Scope         |
| ----------- | ------------------------------------------- | ------------- |
| Config      | `~/.leetcode/workspaces/<name>/config.json` | Per-workspace |
| Timer       | `~/.leetcode/workspaces/<name>/timer.json`  | Per-workspace |
| Collab      | `~/.leetcode/workspaces/<name>/collab.json` | Per-workspace |
| Snapshots   | `~/.leetcode/workspaces/<name>/snapshots/`  | Per-workspace |
| Credentials | `~/.leetcode/credentials.json`              | Shared        |
| Bookmarks   | `~/.leetcode/bookmarks.json`                | Shared        |

Use `leetcode workspace current` to see which workspace is active.

## TUI Configuration

You can also manage workspace settings from TUI:

1. Run `leetcode` to open TUI.
2. Open **Workspace** (`w`) to switch/edit workspace-specific properties.
3. Open **Config** (`c`) to edit active workspace defaults.

Both screens use buffered editing (`Enter` to save, `Esc` to cancel).
