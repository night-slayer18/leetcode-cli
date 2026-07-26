# Configuration

## Initial Setup

The CLI requires your LeetCode authentication cookies.

1. Choose your site (`leetcode.com` or `leetcode.cn`).
2. Login to that site in your browser.
3. Open Browser DevTools (F12) -> Application -> Cookies.
4. Find `LEETCODE_SESSION` and `csrftoken`.
5. Run:
   ```bash
   leetcode login
   ```
6. Paste the values.

## Credential Storage

Credential backend is selected via environment variable:

- Default: `LEETCODECLI_CREDENTIAL_BACKEND=keychain` (system keychain)
- Optional: `LEETCODECLI_CREDENTIAL_BACKEND=file` (encrypted file backend)
- File backend requires: `LEETCODECLI_MASTER_KEY`
- Read-only env mode: set both `LEETCODE_SESSION` and `LEETCODE_CSRF_TOKEN`

When env mode is active, `login/logout` do not persist or clear credentials.

## Windows (PowerShell) Examples

Set backend selection:

```powershell
$env:LEETCODECLI_CREDENTIAL_BACKEND = "keychain"
```

Use encrypted file backend:

```powershell
$env:LEETCODECLI_CREDENTIAL_BACKEND = "file"
$env:LEETCODECLI_MASTER_KEY = "<your_master_key>"
```

Use env read-only auth mode:

```powershell
$env:LEETCODE_SESSION = "<session_cookie>"
$env:LEETCODE_CSRF_TOKEN = "<csrf_cookie>"
```

Clear env variables:

```powershell
Remove-Item Env:LEETCODECLI_CREDENTIAL_BACKEND -ErrorAction SilentlyContinue
Remove-Item Env:LEETCODECLI_MASTER_KEY -ErrorAction SilentlyContinue
Remove-Item Env:LEETCODE_SESSION -ErrorAction SilentlyContinue
Remove-Item Env:LEETCODE_CSRF_TOKEN -ErrorAction SilentlyContinue
```

## Config Command

Use `leetcode config` to view or modify settings.

```bash
# View config
leetcode config

# Set Python as default language
leetcode config -l python3

# Set SQL as default language
leetcode config -l sql

# Select LeetCode site
leetcode config -s leetcode.com
leetcode config -s leetcode.cn

# Set default work directory
leetcode config -w ~/Development/my-leetcode

# Use Zed to open generated solution files
leetcode config --editor zed

# Set Git repository
leetcode config -r https://github.com/myuser/leetcode-solutions.git
```

## Settings

Config is stored per-workspace in `~/.leetcode/workspaces/<name>/config.json`.

| Key        | Description                                          |
| ---------- | ---------------------------------------------------- |
| `lang`     | Default language extension (java, python3, sql, etc) |
| `editor`   | Command to open files (code, zed, vim, nano)         |
| `workDir`  | Directory where solution files are saved             |
| `syncRepo` | Remote Git repository URL                            |
| `site`     | LeetCode site (`leetcode.com` or `leetcode.cn`)      |

## Workspace-Aware Storage

Settings are now stored per-workspace for isolation:

| Data        | Storage Location                                                           | Scope         |
| ----------- | -------------------------------------------------------------------------- | ------------- |
| Config      | `~/.leetcode/workspaces/<name>/config.json`                                | Per-workspace |
| Timer       | `~/.leetcode/workspaces/<name>/timer.json`                                 | Per-workspace |
| Collab      | `~/.leetcode/workspaces/<name>/collab.json`                                | Per-workspace |
| Snapshots   | `~/.leetcode/workspaces/<name>/snapshots/`                                 | Per-workspace |
| Credentials | Keychain (default) or `~/.leetcode/credentials.v2.enc.json` (file backend) | Shared        |
| Bookmarks   | `~/.leetcode/bookmarks.json`                                               | Shared        |

Use `leetcode workspace current` to see which workspace is active.

## TUI Configuration

You can also manage workspace settings from TUI:

1. Run `leetcode` to open TUI.
2. Open **Workspace** (`w`) to switch/edit workspace-specific properties.
3. Open **Config** (`c`) to edit active workspace defaults.

Both screens use buffered editing (`Enter` to save, `Esc` to cancel).

### Zed

Set the editor command to `zed` to open generated contest and problem files in
Zed:

```bash
leetcode config --editor zed
```

`zed`, `zeditor`, and `zed.exe` are supported across platforms. Zed is launched
in the background with only the generated file path; VS Code-specific flags are
not passed to it. The configured editor takes precedence over the `EDITOR`
environment variable.
