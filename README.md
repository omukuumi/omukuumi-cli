# Omukuumi CLI

**Omukuumi** is a Kinyarwanda-first AI coding assistant for the terminal.

## Quick Start

### Universal Install (Linux, macOS, Windows)

```bash
# Linux / macOS / Windows (Git Bash / WSL)
curl -fsSL https://raw.githubusercontent.com/omukuumi/omukuumi-cli/main/install.sh | bash

# Windows PowerShell
iwr https://raw.githubusercontent.com/omukuumi/omukuumi-cli/main/install.ps1 -UseB | iex
```

### npm (after publish)
```bash
npm install -g omukuumi
omukuumi
```

### Manual Install
```bash
git clone https://github.com/omukuumi/omukuumi-cli.git
cd omukuumi-cli
npm install --ignore-scripts
npm run build
cd packages/coding-agent
npm link
omukuumi --help
```

## Installer Options

| Option | Description |
|--------|-------------|
| `--version VERSION` | Install specific version (default: latest) |
| `--dir DIR` | Install directory (default: `~/.omukuumi-cli`) |
| `--no-verify` | Skip SHA256 checksum verification |
| `--force` | Force reinstall even if already installed |
| `--help` | Show help |

### Examples
```bash
# Install specific version
curl -fsSL https://raw.githubusercontent.com/omukuumi/omukuumi-cli/main/install.sh | bash -s -- --version v0.81.0

# Custom install directory
curl -fsSL https://raw.githubusercontent.com/omukuumi/omukuumi-cli/main/install.sh | bash -s -- --dir "$HOME/.local/omukuumi"

# Force reinstall
curl -fsSL https://raw.githubusercontent.com/omukuumi/omukuumi-cli/main/install.sh | bash -s -- --force
```

## Documentation

- **English**: [README.en.md](README.en.md)
- **Kinyarwanda**: [README.rw.md](README.rw.md)

## Quick Usage

```bash
# Interactive mode
omukuumi

# One-shot command
omukuumi -p "Explain this project"

# Include files in prompt
omukuumi @README.md "Summarize this file"

# Show help
omukuumi --help

# List available models
omukuumi --list-models
```

## Features

- **Interactive TUI** with three-column layout (left panel, chat, right panel with Mini-Omukuumi output)
- **Mini-Omukuumi child agents** for parallel task execution
- **Live output streaming** from child agents in right panel
- **Multiple AI providers**: Anthropic, OpenAI, Google Gemini, GitHub Copilot, OpenRouter, Groq, Cerebras, Mistral, Amazon Bedrock, Cloudflare, etc.
- **Cross-platform**: Linux, macOS, Windows (native binaries)
- **Kinyarwanda-first** UI and documentation

## Common Commands

```bash
omukuumi install <source>      # Install an extension/package source
omukuumi remove <source>       # Remove an extension/package source
omukuumi update                # Update Omukuumi
omukuumi list                  # List installed packages/extensions
omukuumi config                # Open package resource configuration
```

Inside interactive mode, type `/` to see slash commands:
```
/settings
/model
/kwinjira
/continue
/new
/compact
/sohoka
```

## Authentication

```bash
# Start Omukuumi and use /kwinjira
omukuumi
# then type: /kwinjira
```

Or provide an API key via environment variables:
```bash
export ANTHROPIC_API_KEY="your-api-key"
omukuumi
```

Supported providers: Anthropic, OpenAI, Google Gemini, GitHub Copilot, OpenRouter, Groq, Cerebras, Mistral, Amazon Bedrock, Cloudflare, and others.

## Development

```bash
npm install --ignore-scripts
npm run build
npm run check
./omukuumi-test.sh
```

Windows development:
```powershell
.\omukuumi-test.ps1
```

## License

MIT - see [LICENSE](LICENSE)