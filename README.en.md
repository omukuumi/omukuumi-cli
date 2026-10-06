# Omukuumi CLI

Omukuumi CLI is a Kinyarwanda-first AI coding assistant for the terminal. It helps developers read, edit, write, and run code from the command line while keeping the familiar workflow of a coding agent.

Website: https://console.omukuumi.org

> Default documentation is Kinyarwanda-first: [README.md](README.md)

## What it does

- Opens an interactive terminal coding assistant with `omukuumi`
- Reads project files and explains code
- Edits and writes files when you ask it to
- Runs shell commands through the built-in bash tool
- Supports multiple AI providers and models
- Supports ubumenyi, extensions, prompt templates, and themes
- Shows Kinyarwanda-first CLI help and slash-command descriptions

## Requirements

- Linux, macOS, or Windows terminal
- Node.js `>=22.19.0`
- npm
- Git
- At least one supported AI provider credential, or login through the CLI

## Install on Linux / macOS

```bash
curl -fsSL https://console.omukuumi.org/install.sh | bash
```

Custom install folder:

```bash
curl -fsSL https://console.omukuumi.org/install.sh | GIHANGA_INSTALL_DIR="$HOME/Tools/omukuumi-cli" bash
```

## Install on Windows PowerShell

```powershell
iwr https://console.omukuumi.org/install.ps1 -UseB | iex
```

Custom install folder:

```powershell
$env:GIHANGA_INSTALL_DIR="$HOME\Tools\omukuumi-cli"; iwr https://console.omukuumi.org/install.ps1 -UseB | iex
```

The installer clones or updates Omukuumi CLI in `~/.omukuumi-cli`, builds it, and links the `omukuumi` command for the current user.

The installer also seeds Omukuumi's Kinyarwanda knowledge pack into `~/.omukuumi/agent`:

- `skills/omukuumi-community/SKILL.md`
- `data/kinyarwanda-keywords.json`

## Manual install

```bash
git clone https://github.com/DannyIRUMVA/omukuumi-command-line-interface.git
cd omukuumi-command-line-interface
npm install --ignore-scripts
npm run build
cd packages/coding-agent
npm link
omukuumi --help
```

## Basic usage

```bash
# Start interactive mode
omukuumi

# Ask one question and exit
omukuumi -p "Explain this project"

# Include files in the first message
omukuumi @README.md "Summarize this file"

# Show help
omukuumi --help

# List available models
omukuumi --list-models
```

## Common commands

```bash
omukuumi install <source>      # Install an extension/package source
omukuumi remove <source>       # Remove an extension/package source
omukuumi update                # Update Omukuumi
omukuumi list                  # List installed packages/extensions
omukuumi config                # Open package resource configuration
```

Inside interactive mode, type `/` to see slash commands such as:

```text
/settings
/model
/kwinjira
/continue
/new
/compact
/sohoka
```

## Authentication

You can start Omukuumi and use `/kwinjira`:

```bash
omukuumi
# then type: /kwinjira
```

Or provide an API key through environment variables such as:

```bash
export ANTHROPIC_API_KEY="your-api-key"
omukuumi
```

Supported providers include Anthropic, OpenAI, Google Gemini, GitHub Copilot, OpenRouter, Groq, Cerebras, Mistral, Amazon Bedrock, Cloudflare, and others.

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

## Notes

- The command name is `omukuumi`.
- Command flags stay in English for compatibility, while help text is Kinyarwanda-first.
- This project is adapted for the Kinyarwanda developer community.

## License

MIT open source license. You can use, copy, modify, distribute, sublicense, and sell copies under the terms in [LICENSE](LICENSE).
