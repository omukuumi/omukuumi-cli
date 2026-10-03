#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/DannyIRUMVA/omukuumi-command-line-interface.git"
INSTALL_DIR="${GIHANGA_INSTALL_DIR:-$HOME/.omukuumi-cli}"
INSTALL_LOG="${GIHANGA_INSTALL_LOG:-${TMPDIR:-/tmp}/omukuumi-install.log}"
: > "$INSTALL_LOG"

run_quiet() {
	local label="$1"
	shift
	echo "$label"
	if ! "$@" >>"$INSTALL_LOG" 2>&1; then
		echo "Error: $label failed. Log: $INSTALL_LOG" >&2
		tail -40 "$INSTALL_LOG" >&2 || true
		exit 1
	fi
}

run_quiet_shell() {
	local label="$1"
	shift
	echo "$label"
	if ! bash -lc "$*" >>"$INSTALL_LOG" 2>&1; then
		echo "Error: $label failed. Log: $INSTALL_LOG" >&2
		tail -40 "$INSTALL_LOG" >&2 || true
		exit 1
	fi
}

require_command() {
	if ! command -v "$1" >/dev/null 2>&1; then
		echo "Error: '$1' irakenewe ariko ntiyabonetse." >&2
		exit 1
	fi
}

require_command git
require_command node
require_command npm

remove_stale_omukuumi_helper() {
	local existing=""
	existing="$(command -v omukuumi 2>/dev/null || true)"
	[ -n "$existing" ] || return 0
	if [ -f "$existing" ] || [ -L "$existing" ]; then
		if "$existing" --help 2>/dev/null | grep -q "Omukuumi CLI helper"; then
			if rm -f "$existing" 2>/dev/null; then
				hash -r 2>/dev/null || true
				echo "Removed old Omukuumi helper: $existing"
			else
				echo "Warning: old Omukuumi helper is still in PATH: $existing" >&2
				echo "Remove it manually or make sure the npm global bin directory appears earlier in PATH." >&2
			fi
		fi
	fi
}

remove_stale_omukuumi_helper

NPM_PREFIX="${npm_config_prefix:-$(npm config get prefix 2>/dev/null || true)}"
if [ -n "$NPM_PREFIX" ] && [ ! -w "$NPM_PREFIX" ]; then
	export npm_config_prefix="${npm_config_prefix:-$HOME/.local}"
	mkdir -p "$npm_config_prefix/bin"
fi

if [ -d "$INSTALL_DIR/.git" ]; then
	run_quiet "Kuvugurura Omukuumi..." git -C "$INSTALL_DIR" fetch --quiet origin main
	run_quiet "Guhuza Omukuumi..." git -C "$INSTALL_DIR" reset --hard --quiet origin/main
elif [ -e "$INSTALL_DIR" ]; then
	echo "Error: $INSTALL_DIR exists but is not a git repository." >&2
	echo "Set GIHANGA_INSTALL_DIR to another path or remove that folder." >&2
	exit 1
else
	run_quiet "Kwinjiza Omukuumi..." git clone --quiet "$REPO_URL" "$INSTALL_DIR"
fi

cd "$INSTALL_DIR"
run_quiet "Gutegura amapakeji..." npm install --ignore-scripts --silent --no-fund --no-audit --loglevel=error
run_quiet "Kubaka Omukuumi..." npm run build --silent
remove_stale_omukuumi_helper
run_quiet_shell "Gushyira Omukuumi muri terminal..." "cd packages/coding-agent && npm link --silent"
hash -r 2>/dev/null || true
remove_stale_omukuumi_helper

GIHANGA_AGENT_DIR="${GIHANGA_AGENT_DIR:-$HOME/.omukuumi/agent}"
mkdir -p "$GIHANGA_AGENT_DIR/skills" "$GIHANGA_AGENT_DIR/data" "$GIHANGA_AGENT_DIR/scripts"
cp -R "$INSTALL_DIR/resources/omukuumi/agent/skills/omukuumi-community" "$GIHANGA_AGENT_DIR/skills/"
cp "$INSTALL_DIR"/resources/omukuumi/agent/data/* "$GIHANGA_AGENT_DIR/data/"
if [ -f "$INSTALL_DIR/resources/omukuumi/agent/models.json" ]; then
	cp "$INSTALL_DIR/resources/omukuumi/agent/models.json" "$GIHANGA_AGENT_DIR/models.json"
	MODELS_PATH="$GIHANGA_AGENT_DIR/models.json" node <<'JS'
const fs = require("fs");
const path = process.env.MODELS_PATH;
const data = JSON.parse(fs.readFileSync(path, "utf8"));
for (const provider of Object.values(data.providers || {})) {
	for (const model of provider.models || []) {
		model.input = ["text"];
		if (Array.isArray(model.output)) model.output = model.output.filter((value) => value === "text");
		if (Array.isArray(model.output) && model.output.length === 0) delete model.output;
	}
}
fs.writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
JS
fi
cp "$INSTALL_DIR"/resources/omukuumi/agent/scripts/* "$GIHANGA_AGENT_DIR/scripts/"

if [ "${GIHANGA_INSTALL_MBAZA_NLP:-0}" = "1" ] || [ "${GIHANGA_INSTALL_MBAZA_NLP:-}" = "true" ]; then
	MBAZA_ARGS=(--dataset "${GIHANGA_MBAZA_NLP_DATASET:-mbazaNLP/kinyarwanda_monolingual_v01.0}")
	if [ "${GIHANGA_MBAZA_METADATA_ONLY:-0}" = "1" ] || [ "${GIHANGA_MBAZA_METADATA_ONLY:-}" = "true" ]; then
		MBAZA_ARGS+=(--metadata-only)
	fi
	node "$GIHANGA_AGENT_DIR/scripts/import-mbaza-nlp.mjs" "${MBAZA_ARGS[@]}"
fi

if [ -n "${AZURE_OPENAI_API_KEY:-}" ] && { [ -n "${AZURE_OPENAI_BASE_URL:-}" ] || [ -n "${AZURE_OPENAI_RESOURCE_NAME:-}" ]; }; then
	AUTH_PATH="$GIHANGA_AGENT_DIR/auth.json" node <<'JS'
const fs = require("fs");
const path = process.env.AUTH_PATH;
const baseFromResource = (name) => `https://${name}.openai.azure.com`;
const resourceFromBase = (baseUrl) => {
	try { return new URL(baseUrl).hostname.split(".")[0] || undefined; } catch { return undefined; }
};
const current = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, "utf8") || "{}") : {};
const resourceName = process.env.AZURE_OPENAI_RESOURCE_NAME || resourceFromBase(process.env.AZURE_OPENAI_BASE_URL || "");
const baseUrl = process.env.AZURE_OPENAI_BASE_URL || (resourceName ? baseFromResource(resourceName) : undefined);
current["azure-openai-responses"] = {
	type: "api_key",
	key: "AZURE_OPENAI_API_KEY",
	env: {
		...(baseUrl ? { AZURE_OPENAI_BASE_URL: baseUrl } : {}),
		...(resourceName ? { AZURE_OPENAI_RESOURCE_NAME: resourceName } : {}),
		...(process.env.AZURE_OPENAI_API_VERSION ? { AZURE_OPENAI_API_VERSION: process.env.AZURE_OPENAI_API_VERSION } : {}),
	},
};
fs.mkdirSync(require("path").dirname(path), { recursive: true, mode: 0o700 });
fs.writeFileSync(path, JSON.stringify(current, null, 2), { mode: 0o600 });
JS
fi

echo ""
echo "Omukuumi CLI installed successfully."
echo "Kinyarwanda keyword data installed in: $GIHANGA_AGENT_DIR"
if command -v omukuumi >/dev/null 2>&1; then
	GIHANGA_BIN="$(command -v omukuumi)"
	echo "Installed command: $GIHANGA_BIN"
	echo "Run: omukuumi --help"
elif [ -n "${npm_config_prefix:-}" ]; then
	echo "Add $npm_config_prefix/bin to your PATH if needed."
	echo "Then run: omukuumi --help"
else
	echo "Run: omukuumi --help"
fi
