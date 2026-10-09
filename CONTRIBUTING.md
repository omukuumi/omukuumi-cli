# Contributing to Omukuumi

Thank you for your interest in contributing! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Security](#security)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- Node.js >= 22.19.0
- npm >= 11.16.0
- Bun >= 1.3.14 (for binary builds)

### Setup

```bash
# Clone the repository
git clone https://github.com/omukuumi/omukuumi-cli.git
cd omukuumi-cli

# Install dependencies
npm ci --ignore-scripts

# Build all packages
npm run build

# Run tests
npm test

# Run checks
npm run check
```

## Development Workflow

### Branch Naming

- `feat/<description>` - New features
- `fix/<description>` - Bug fixes
- `refactor/<description>` - Code refactoring
- `docs/<description>` - Documentation changes
- `test/<description>` - Test additions/changes
- `security/<description>` - Security fixes
- `chore/<description>` - Maintenance tasks

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types:
- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code refactoring
- `docs` - Documentation
- `test` - Tests
- `security` - Security fix
- `ci` - CI/CD changes
- `chore` - Maintenance

Example:
```
feat(core): add new browser automation tool

Adds new tool for browser-based testing with Playwright.

Closes #123
```

## Coding Standards

### TypeScript

- Use strict TypeScript configuration
- Prefer `type` over `interface` for unions/intersections
- Use `const` assertions for literal types
- Avoid `any` - use `unknown` with type guards
- Prefer explicit return types for public APIs

### Code Style

- Follow Biome formatter (run `npm run check`)
- Use meaningful variable names
- Prefer early returns
- Keep functions small and focused
- Document public APIs with JSDoc

### Architecture

- Follow monorepo workspace structure
- Keep packages loosely coupled
- Use dependency injection for testability
- Prefer composition over inheritance

## Testing

### Running Tests

```bash
# All tests
npm test

# Specific workspace
npm test --workspace=packages/coding-agent

# Watch mode
npm test -- --watch
```

### Test Requirements

- All new code must have tests
- Maintain >80% code coverage
- Tests must be deterministic
- No flaky tests
- Integration tests for critical paths

### Test Structure

- Unit tests: `*.test.ts` alongside source
- Integration tests: `test/integration/`
- Fixtures: `test/fixtures/`

## Security

### Security Considerations

- Never commit secrets, tokens, or credentials
- Use environment variables for configuration
- Validate all external inputs
- Use parameterized queries for databases
- Implement proper authentication/authorization
- Follow principle of least privilege

### Dependency Security

- All dependencies pinned to exact versions
- Lockfiles committed and validated
- Dependabot enabled for security updates
- No unpinned ranges in production

### Reporting Vulnerabilities

See [SECURITY.md](SECURITY.md) for reporting process.

## Pull Request Process

### Before Submitting

- [ ] All CI checks pass
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
- [ ] Security considerations addressed

### Review Process

1. PR must pass all CI checks
2. At least 1 approving review required
3. Code owner review required for sensitive files
4. Stale reviews dismissed on new commits
5. Linear history required (squash merge)

### Merge Requirements

- Linear history (squash merge)
- No merge commits
- No rebase merges
- Force pushes blocked
- Deletions blocked

## Release Process

### Versioning

Follows [Semantic Versioning](https://semver.org/):
- `MAJOR` - Breaking changes
- `MINOR` - New features (backward compatible)
- `PATCH` - Bug fixes (backward compatible)

### Release Checklist

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Run full CI pipeline
4. Tag release: `git tag v<version>`
4. Push tag to trigger release workflow
5. Verify GitHub Release created
6. Verify npm package published
7. Verify installers work

### Release Workflow

The release workflow automatically:
1. Builds binaries for all platforms
2. Creates draft GitHub Release with assets
3. Publishes to npm with provenance
4. Promotes draft to public release

## Getting Help

- Check existing issues/PRs
- Join discussions in GitHub Discussions
- Contact core team: core@omukuumi.org
- Security issues: security@omukuumi.org

---

Thank you for contributing to Omukuumi! 🚀