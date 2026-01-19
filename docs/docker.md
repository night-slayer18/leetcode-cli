# Docker Usage

Run the CLI via Docker without local Node.js installation.

## Pre-built Image (Recommended)

You can pull the image directly from Docker Hub.

```bash
docker pull nightslayer/leetcode-cli:latest
```

### Setup Shell Function

Add to your shell config (functions forward arguments properly, aliases don't):

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

### Usage

```bash
leetcode list
leetcode pick 1
leetcode submit 1
```

## Build Locally

If you prefer to build it yourself:

1. **Build**:

   ```bash
   docker build -t leetcode-cli .
   ```

2. **Run** (Bash/Zsh):
   ```bash
   docker run -it --rm \
     -w /root/leetcode \
     -v "$(pwd)/leetcode:/root/leetcode" \
     -v "$HOME/.leetcode:/root/.leetcode" \
     leetcode-cli list
   ```
