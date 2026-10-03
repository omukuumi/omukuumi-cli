#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

npm install --ignore-scripts
npm run build
(cd packages/coding-agent && npm link)

echo "Omukuumi CLI installed locally."
echo "Run: omukuumi --help"
