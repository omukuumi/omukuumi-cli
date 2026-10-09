# Security Policy

## Supported Versions

We provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.81.x  | :white_check_mark: |
| < 0.81  | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly:

1. **Do not** open a public GitHub issue
2. Email us at **security@omukuumi.org** with details
3. Include steps to reproduce, impact assessment, and any proof-of-concept

We will acknowledge receipt within 48 hours and provide a timeline for fix.

## Security Features

### Enabled Protections
- ✅ **Secret Scanning** - Detects leaked secrets in commits
- ✅ **Secret Scanning Push Protection** - Blocks pushes containing secrets
- ✅ **Dependabot Security Updates** - Auto-PRs for vulnerable dependencies
- ✅ **Secret Scanning Validity Checks** - Validates detected secrets

### Branch Protection
- `main` branch requires:
  - PR review from code owners (see [CODEOWNERS](CODEOWNERS))
  - Status checks to pass (CI, tests, shrinkwrap validation)
  - No force pushes
  - No deletions

### Dependency Security
- All dependencies pinned to exact versions
- `npm-shrinkwrap.json` and install-lock for deterministic installs
- `npm-audit` run in CI
- No `npm install` with `--legacy-peer-deps` in CI

### Release Security
- Releases signed with npm provenance
- SHA256SUMS published with each release
- Installers verify checksums before execution
- npm packages published with `--access public --provenance`

## Threat Model

### Supply Chain
- All dependencies pinned to exact versions
- Lockfiles committed and validated in CI
- No unpinned ranges in production dependencies

### Secrets Management
- No secrets in code or history
- Secret scanning on every push
- Push protection blocks accidental leaks
- CI uses ephemeral tokens (`GITHUB_TOKEN`)

### Binary Distribution
- Binaries built in isolated CI environment
- SHA256SUMS published with releases
- Installers verify checksums before execution
- No installer auto-updates without verification

## Security Contacts

- **Security Team**: security@omukuumi.org
- **Core Team**: core@omukuumi.org

## Responsible Disclosure

We follow coordinated vulnerability disclosure. We ask that you give us reasonable time to address issues before public disclosure. We will credit reporters who follow this process.