# Docker Usage

Run the CLI via Docker without local Node.js installation.

## Pre-built Image (Recommended)
You can pull the image directly from Docker Hub.

```bash
docker pull nightslayer/leetcode-cli:latest
```

### Setup Alias
Add this to your shell profile (`~/.zshrc` or `~/.bashrc`):
```bash
alias leetcode="docker run -it --rm -v \$(pwd)/leetcode:/root/leetcode -v ~/.leetcode:/root/.leetcode nightslayer/leetcode-cli:latest"
```

### Usage
```bash
leetcode list
```

## Build Locally
If you prefer to build it yourself:

1. **Build**:
   ```bash
   docker build -t leetcode-cli .
   ```

2. **Run**:
   ```bash
   docker run -it --rm -v $(pwd)/leetcode:/root/leetcode -v ~/.leetcode:/root/.leetcode leetcode-cli list
   ```
