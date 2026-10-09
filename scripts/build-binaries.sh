#!/usr/bin/env bash
#
# Build omukuumi binaries for all platforms locally.
# Mirrors .github/workflows/build-binaries.yml
#
# Usage:
#   ./scripts/build-binaries.sh [--skip-install] [--skip-deps] [--skip-build] [--platform <platform>] [--out <dir>]
#
# Options:
#   --skip-install      Skip npm ci
#   --skip-deps         Skip installing cross-platform dependencies
#   --skip-build        Skip npm run build
#   --platform <name>   Build only for specified platform (darwin-arm64, darwin-x64, linux-x64, linux-arm64, windows-x64, windows-arm64)
#   --out <dir>         Output directory (default: packages/coding-agent/binaries)
#
# Output:
#   packages/coding-agent/binaries/
#     omukuumi-darwin-arm64.tar.gz
#     omukuumi-darwin-x64.tar.gz
#     omukuumi-linux-x64.tar.gz
#     omukuumi-linux-arm64.tar.gz
#     omukuumi-windows-x64.zip
#     omukuumi-windows-arm64.zip

set -euo pipefail

cd "$(dirname "$0")/.."
REPO_ROOT="$(pwd)"

# Extract clipboard version early for use in dependency installation
CLIPBOARD_VERSION=$(node -p "require('./packages/coding-agent/package.json').optionalDependencies['@mariozechner/clipboard']")

SKIP_INSTALL=false
SKIP_DEPS=false
SKIP_BUILD=false
PLATFORM=""
OUTPUT_DIR=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-install)
            SKIP_INSTALL=true
            shift
            ;;
        --skip-deps)
            SKIP_DEPS=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --platform)
            PLATFORM="$2"
            shift 2
            ;;
        --out)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Validate platform if specified
if [[ -n "$PLATFORM" ]]; then
    case "$PLATFORM" in
        darwin-arm64|darwin-x64|linux-x64|linux-arm64|windows-x64|windows-arm64)
            ;;
        *)
            echo "Invalid platform: $PLATFORM"
            echo "Valid platforms: darwin-arm64, darwin-x64, linux-x64, linux-arm64, windows-x64, windows-arm64"
            exit 1
            ;;
    esac
fi

if [[ -z "$OUTPUT_DIR" ]]; then
    OUTPUT_DIR="packages/coding-agent/binaries"
fi
if [[ "$OUTPUT_DIR" != /* ]]; then
    OUTPUT_DIR="$(pwd)/$OUTPUT_DIR"
fi

if [[ "$SKIP_INSTALL" == "false" ]]; then
    echo "==> Installing dependencies..."
    npm ci --ignore-scripts
    # Install optional clipboard wrapper package (not installed by default as optionalDependency)
    npm install --ignore-scripts @mariozechner/clipboard@$CLIPBOARD_VERSION
else
    echo "==> Skipping npm ci (--skip-install)"
fi

if [[ "$SKIP_DEPS" == "false" ]]; then
    echo "==> Downloading cross-platform native bindings with npm pack..."
    NATIVE_PACKAGE_DIR="$REPO_ROOT/node_modules/@mariozechner"
    NATIVE_PACKAGE_TMP=$(mktemp -d)
    trap 'rm -rf "$NATIVE_PACKAGE_TMP"' EXIT
    for native_package in clipboard-darwin-arm64 clipboard-darwin-x64 clipboard-linux-x64-gnu clipboard-linux-arm64-gnu clipboard-win32-x64-msvc clipboard-win32-arm64-msvc; do
        native_dir="$NATIVE_PACKAGE_DIR/$native_package"
        if [[ -d "$native_dir" ]]; then continue; fi
        echo "  Fetching @mariozechner/$native_package@$CLIPBOARD_VERSION"
        archive=$(npm pack --ignore-scripts --silent --pack-destination "$NATIVE_PACKAGE_TMP" "@mariozechner/$native_package@$CLIPBOARD_VERSION")
        mkdir -p "$native_dir"
        tar -xzf "$NATIVE_PACKAGE_TMP/$archive" --strip-components=1 -C "$native_dir"
    done
else
    echo "==> Skipping cross-platform native bindings (--skip-deps)"
fi

if [[ "$SKIP_BUILD" == "false" ]]; then
    echo "==> Building all workspace packages..."
    cd "$REPO_ROOT"
    npm run build
else
    echo "==> Skipping package build (--skip-build)"
fi

echo "==> Building binaries..."
cd "$REPO_ROOT/packages/coding-agent"

# Ensure bun dependencies are resolved for compilation
echo "==> Installing bun dependencies..."
bun install

# Clean previous builds
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"/{darwin-arm64,darwin-x64,linux-x64,linux-arm64,windows-x64,windows-arm64}

# Determine which platforms to build
if [[ -n "$PLATFORM" ]]; then
    PLATFORMS=("$PLATFORM")
else
    PLATFORMS=(darwin-arm64 darwin-x64 linux-x64 linux-arm64 windows-x64 windows-arm64)
fi

for platform in "${PLATFORMS[@]}"; do
    echo "Building for $platform..."
    # Bun compiled executables only embed worker scripts when they are passed as
    # explicit build entrypoints. The runtime can still use new URL(...), but the
    # worker must be present in the compiled executable.
    # Externalize only clipboard native addon; playwright-core must be bundled.
    # Use esbuild to bundle first (resolves all imports to relative paths),
    # then compile with bun to avoid absolute path embedding.
    EXTERNAL_FLAGS=(--external @mariozechner/clipboard)
    
    # First, use esbuild to bundle the CLI and its dependencies from the root
    # (dependencies are hoisted to root node_modules in npm workspaces)
    echo "  Bundling with esbuild..."
    (cd "$REPO_ROOT" && npx esbuild ./packages/coding-agent/dist/bun/cli.js \
        --platform=node \
        --target=node22 \
        --format=esm \
        --bundle \
        --external:@mariozechner/clipboard \
        --outfile="$OUTPUT_DIR/$platform/omukuumi-bundled.js" \
        --packages=external \
        --main-fields=module,main \
        --resolve-extensions=.ts,.tsx,.js,.json)
    
    # Then compile with bun
    if [[ "$platform" == windows-* ]]; then
        bun build --compile --target=bun-$platform "$OUTPUT_DIR/$platform/omukuumi-bundled.js" ./src/utils/image-resize-worker.ts "${EXTERNAL_FLAGS[@]}" --outfile "$OUTPUT_DIR/$platform/omukuumi.exe"
    else
        bun build --compile --target=bun-$platform "$OUTPUT_DIR/$platform/omukuumi-bundled.js" ./src/utils/image-resize-worker.ts "${EXTERNAL_FLAGS[@]}" --outfile "$OUTPUT_DIR/$platform/omukuumi"
    fi
    
    # Clean up bundled file
    rm -f "$OUTPUT_DIR/$platform/omukuumi-bundled.js"
done

echo "==> Creating release archives..."

# Copy shared files to each platform directory
for platform in "${PLATFORMS[@]}"; do
    cp package.json "$OUTPUT_DIR/$platform/"
    cp README.md "$OUTPUT_DIR/$platform/"
    cp CHANGELOG.md "$OUTPUT_DIR/$platform/"
    if [[ -f "$REPO_ROOT/node_modules/@silvia-odwyer/photon-node/photon_rs_bg.wasm" ]]; then
        cp "$REPO_ROOT/node_modules/@silvia-odwyer/photon-node/photon_rs_bg.wasm" "$OUTPUT_DIR/$platform/"
    else
        echo "  WARNING: photon_rs_bg.wasm not found, skipping..."
    fi
    mkdir -p "$OUTPUT_DIR/$platform/theme"
    cp dist/modes/interactive/theme/*.json "$OUTPUT_DIR/$platform/theme/"
    mkdir -p "$OUTPUT_DIR/$platform/assets"
    cp dist/modes/interactive/assets/* "$OUTPUT_DIR/$platform/assets/"
    cp -r dist/core/export-html "$OUTPUT_DIR/$platform/"
    cp -r docs "$OUTPUT_DIR/$platform/"
    cp -r examples "$OUTPUT_DIR/$platform/"

    case "$platform" in
        darwin-arm64)
            clipboard_native_package="clipboard-darwin-arm64"
            clipboard_native_file="clipboard.darwin-arm64.node"
            ;;
        darwin-x64)
            clipboard_native_package="clipboard-darwin-x64"
            clipboard_native_file="clipboard.darwin-x64.node"
            ;;
        linux-x64)
            clipboard_native_package="clipboard-linux-x64-gnu"
            clipboard_native_file="clipboard.linux-x64-gnu.node"
            ;;
        linux-arm64)
            clipboard_native_package="clipboard-linux-arm64-gnu"
            clipboard_native_file="clipboard.linux-arm64-gnu.node"
            ;;
        windows-x64)
            clipboard_native_package="clipboard-win32-x64-msvc"
            clipboard_native_file="clipboard.win32-x64-msvc.node"
            ;;
        windows-arm64)
            clipboard_native_package="clipboard-win32-arm64-msvc"
            clipboard_native_file="clipboard.win32-arm64-msvc.node"
            ;;
    esac
    mkdir -p "$OUTPUT_DIR/$platform/node_modules/@mariozechner"
    cp -r "$REPO_ROOT/node_modules/@mariozechner/clipboard" "$OUTPUT_DIR/$platform/node_modules/@mariozechner/"
    if [[ -d "$REPO_ROOT/node_modules/@mariozechner/$clipboard_native_package" ]]; then
        cp -r "$REPO_ROOT/node_modules/@mariozechner/$clipboard_native_package" "$OUTPUT_DIR/$platform/node_modules/@mariozechner/"
        cp "$REPO_ROOT/node_modules/@mariozechner/$clipboard_native_package/$clipboard_native_file" \
            "$OUTPUT_DIR/$platform/node_modules/@mariozechner/clipboard/"
    else
        echo "  WARNING: $clipboard_native_package not found, clipboard may not work on this platform"
    fi
    # Copy terminal input native helpers next to compiled binaries.
    if [[ "$platform" == darwin-* ]]; then
        mkdir -p "$OUTPUT_DIR/$platform/native/darwin/prebuilds/$platform"
        cp "$REPO_ROOT/packages/tui/native/darwin/prebuilds/$platform/darwin-modifiers.node" "$OUTPUT_DIR/$platform/native/darwin/prebuilds/$platform/"
    fi
    if [[ "$platform" == windows-* ]]; then
        if [[ "$platform" == "windows-arm64" ]]; then
            win32_arch_dir="win32-arm64"
        else
            win32_arch_dir="win32-x64"
        fi
        mkdir -p "$OUTPUT_DIR/$platform/native/win32/prebuilds/$win32_arch_dir"
        cp "$REPO_ROOT/packages/tui/native/win32/prebuilds/$win32_arch_dir/win32-console-mode.node" "$OUTPUT_DIR/$platform/native/win32/prebuilds/$win32_arch_dir/"
    fi
done

# Create archives
cd "$OUTPUT_DIR"

for platform in "${PLATFORMS[@]}"; do
    if [[ "$platform" == windows-* ]]; then
        # Windows (zip)
        echo "Creating omukuumi-$platform.zip..."
        (cd "$platform" && zip -r ../omukuumi-$platform.zip .)
    else
        # Unix platforms (tar.gz) - use wrapper directory for mise compatibility
        echo "Creating omukuumi-$platform.tar.gz..."
        mv "$platform" omukuumi && tar -czf omukuumi-$platform.tar.gz omukuumi && mv omukuumi "$platform"
    fi
done

# Extract archives for easy local testing
echo "==> Extracting archives for testing..."
for platform in "${PLATFORMS[@]}"; do
    rm -rf "$platform"
    if [[ "$platform" == windows-* ]]; then
        mkdir -p "$platform" && (cd "$platform" && unzip -q ../omukuumi-$platform.zip)
    else
        tar -xzf omukuumi-$platform.tar.gz && mv omukuumi "$platform"
    fi
done

echo ""
echo "==> Build complete!"
echo "Archives available in $OUTPUT_DIR/"
ls -lh *.tar.gz *.zip 2>/dev/null || true
echo ""
echo "Extracted directories for testing:"
for platform in "${PLATFORMS[@]}"; do
    if [[ "$platform" == windows-* ]]; then
        echo "  $OUTPUT_DIR/$platform/omukuumi.exe"
    else
        echo "  $OUTPUT_DIR/$platform/omukuumi"
    fi
done
