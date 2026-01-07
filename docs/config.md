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

# Set default work directory
leetcode config -w ~/Development/my-leetcode

# Set Git repository
leetcode config -r https://github.com/myuser/leetcode-solutions.git
```

## Settings
Config is stored in `~/.leetcode/config.json`.

| Key | Description |
|-----|-------------|
| `language` | Default language extension to use (java, python3, cpp, etc) |
| `editor` | Command to open files (code, vim, nano) |
| `workDir` | Directory where solution files are saved |
| `repo` | Remote Git repository URL |
