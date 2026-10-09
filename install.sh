#!/usr/bin/env bash
#
# Universal Omukuumi Installer
# Works on: Linux, macOS, Windows (Git Bash / WSL / MSYS2)
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/omukuumi/omukuumi-cli/main/install.sh | bash
#   curl -fsSL https://raw.githubusercontent.com/omukuumi/omukuumi-cli/main/install.sh | bash -s -- --version v0.81.0
#   curl -fsSL https://raw.githubusercontent.com/omukuumi/omukuumi-cli/main/install.sh | bash -s -- --dir "$HOME/.local/omukuumi"
#
# Options:
#   --version VERSION    Install specific version (default: latest)
#   --dir DIR            Install directory (default: ~/.omukuumi-cli)
#   --no-verify          Skip checksum verification
#   --help               Show this help

set -euo pipefail

# ─── Defaults ──────────────────────────────────────────────────────────────
INSTALL_DIR="${OMUKUUMI_INSTALL_DIR:-$HOME/.omukuumi-cli}"
REPO="omukuumi/omukuumi-cli"
VERSION=""
NO_VERIFY=false
FORCE=false

# ─── Colors ────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info()  { echo -e "${BLUE}[INFO]${NC} $*"; }
log_ok()    { echo -e "${GREEN}[OK]${NC} $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_err()   { echo -e "${RED}[ERR]${NC} $*"; }

# ─── Helpers ───────────────────────────────────────────────────────────────
usage() {
    sed -n '2,18p' "$0" | sed 's/^# //; s/^#//'
    exit 0
}

detect_platform() {
    local os arch
    os=$(uname -s | tr '[:upper:]' '[:lower:]')
    arch=$(uname -m)

    case "$os" in
        linux)   OS="linux" ;;
        darwin)  OS="darwin" ;;
        cygwin*|mingw*|msys*) OS="windows" ;;
        *)       log_err "Unsupported OS: $os"; exit 1 ;;
    esac

    case "$arch" in
        x86_64|amd64) ARCH="x64" ;;
        aarch64|arm64) ARCH="arm64" ;;
        *) log_err "Unsupported architecture: $arch"; exit 1 ;;
    esac

    log_info "Detected platform: $OS-$ARCH"
}

get_latest_version() {
    log_info "Fetching latest version from GitHub..."
    VERSION=$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" \
        | grep '"tag_name"' | head -1 | sed -E 's/.*"v?([^"]+)".*/\1/')
    if [[ -z "$VERSION" ]]; then
        log_err "Failed to fetch latest version"
        exit 1
    fi
    log_ok "Latest version: $VERSION"
}

download_binary() {
    local url filename
    if [[ "$OS" == "windows" ]]; then
        filename="omukuumi-windows-$ARCH.zip"
        url="https://github.com/$REPO/releases/download/v$VERSION/$filename"
    else
        filename="omukuumi-$OS-$ARCH.tar.gz"
        url="https://github.com/$REPO/releases/download/v$VERSION/$filename"
    fi

    ARCHIVE="${TMPDIR:-/tmp}/omukuumi-$VERSION-$OS-$ARCH${filename#omukuumi-$OS-$ARCH}"
    RELEASE_ASSET="$filename"
    log_info "Downloading $filename..."
    curl -fsSL "$url" -o "$ARCHIVE" || {
        log_err "Download failed. Check version exists: https://github.com/$REPO/releases/tag/v$VERSION"
        exit 1
    }
    log_ok "Downloaded to $ARCHIVE"
}

verify_checksum() {
    if [[ "$NO_VERIFY" == "true" ]]; then
        log_warn "Skipping checksum verification (--no-verify)"
        return
    fi

    local sha_url sha_local sha_remote asset_name
    sha_url="https://github.com/$REPO/releases/download/v$VERSION/SHA256SUMS"
    asset_name="$2"
    log_info "Verifying checksum..."
    sha_remote=$(curl -fsSL "$sha_url" 2>/dev/null | awk -v file="$asset_name" '$2 == file {print $1}')
    sha_local=$(sha256sum "$1" | awk '{print $1}')

    if [[ -n "$sha_remote" && "$sha_local" == "$sha_remote" ]]; then
        log_ok "Checksum verified"
    elif [[ -z "$sha_remote" ]]; then
        log_warn "No SHA256SUMS found on release, skipping verification"
    else
        log_err "Checksum mismatch! Expected: $sha_remote, Got: $sha_local"
        exit 1
    fi
}

extract_binary() {
    local archive="$1"
    local dest="$2"

    local staging="$TMPDIR/omukuumi-extract-$VERSION-$$"
    mkdir -p "$dest" "$staging"
    log_info "Extracting to $dest..."

    if [[ "$archive" == *.zip ]]; then
        unzip -qo "$archive" -d "$staging" || { log_err "unzip failed"; rm -rf "$staging"; exit 1; }
    else
        tar -xzf "$archive" -C "$staging" || { log_err "tar failed"; rm -rf "$staging"; exit 1; }
    fi

    local payload="$staging"
    if [[ -d "$staging/omukuumi" ]]; then
        payload="$staging/omukuumi"
    fi
    if [[ ! -f "$payload/omukuumi" && ! -f "$payload/omukuumi.exe" ]]; then
        log_err "Archive does not contain the expected Omukuumi executable"
        rm -rf "$staging"
        exit 1
    fi

    # Keep the executable beside its runtime assets, native modules, and templates.
    cp -a "$payload/." "$dest/"
    chmod +x "$dest/omukuumi" 2>/dev/null || true
    rm -rf "$staging"
    log_ok "Binary installed at $dest/omukuumi"
}

setup_path() {
    local dest="$1"
    local shell_rc=""

    # Detect shell config file
    if [[ -n "${ZSH_VERSION:-}" ]]; then
        shell_rc="${ZDOTDIR:-$HOME}/.zshrc"
    elif [[ -n "${BASH_VERSION:-}" ]]; then
        shell_rc="$HOME/.bashrc"
    else
        shell_rc="$HOME/.profile"
    fi

    local path_entry="export PATH=\"$dest:\$PATH\""

    if [[ -f "$shell_rc" ]] && grep -q "$dest" "$shell_rc"; then
        log_info "PATH already configured in $shell_rc"
        return
    fi

    echo "" >> "$shell_rc"
    echo "# Omukuumi CLI" >> "$shell_rc"
    echo "$path_entry" >> "$shell_rc"
    log_ok "Added $dest to PATH in $shell_rc"
    log_info "Run: source $shell_rc  (or restart your terminal)"
}

create_wrapper() {
    local dest="$1"
    local bin_dir="$HOME/.local/bin"

    if [[ ! -d "$bin_dir" ]]; then
        return
    fi

    local target="$bin_dir/omukuumi"
    local source="$dest/omukuumi"
    [[ "$OS" == "windows" ]] && source="$dest/omukuumi.exe"

    if [[ -f "$source" ]]; then
        ln -sf "$source" "$target" 2>/dev/null || true
        log_ok "Created symlink: $target -> $source"
    fi
}

# ─── Parse Args ────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
    case $1 in
        --version) VERSION="$2"; shift 2 ;;
        --dir)     INSTALL_DIR="$2"; shift 2 ;;
        --no-verify) NO_VERIFY=true; shift ;;
        --force)   FORCE=true; shift ;;
        --help)    usage ;;
        *) log_err "Unknown option: $1"; usage ;;
    esac
done

# ─── Main ──────────────────────────────────────────────────────────────────
main() {
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║         Omukuumi CLI — Universal Installer                 ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo ""

    detect_platform

    if [[ -z "$VERSION" ]]; then
        get_latest_version
    else
        log_info "Installing version: $VERSION"
    fi

    # Check if already installed
    if [[ -f "$INSTALL_DIR/omukuumi" || -f "$INSTALL_DIR/omukuumi.exe" ]] && [[ "$FORCE" != "true" ]]; then
        log_warn "Omukuumi already installed at $INSTALL_DIR"
        log_info "Use --force to reinstall, or run: $INSTALL_DIR/omukuumi --version"
        exit 0
    fi

    VERSION="${VERSION#v}"
    TMPDIR="${TMPDIR:-/tmp}"
    download_binary
    verify_checksum "$ARCHIVE" "$RELEASE_ASSET"
    extract_binary "$ARCHIVE" "$INSTALL_DIR"
    rm -f "$ARCHIVE"
    setup_path "$INSTALL_DIR"
    create_wrapper "$INSTALL_DIR"

    echo ""
    log_ok "Omukuumi $VERSION installed successfully!"
    echo ""
    echo "Next steps:"
    echo "  1. Restart your terminal, or run:"
    echo "     source ~/.bashrc   # or ~/.zshrc, ~/.profile"
    echo "  2. Run Omukuumi:"
    echo "     omukuumi"
    echo ""
    echo "Install location: $INSTALL_DIR"
    echo "Binary: omukuumi${OS:+.exe}"
}

main "$@"