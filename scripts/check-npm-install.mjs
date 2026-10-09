#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const packageDir = join(repoRoot, "packages/coding-agent");
const packageJson = JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8"));
const workspace = mkdtempSync(join(tmpdir(), "omukuumi-npm-install-"));
const packDir = join(workspace, "pack");
const prefix = join(workspace, "global");

function run(command, args, options = {}) {
	const { capture = false, cwd = packageDir, ...execOptions } = options;
	console.log(`$ ${command} ${args.join(" ")}`);
	return execFileSync(command, args, {
		cwd,
		encoding: "utf8",
		stdio: capture ? ["ignore", "pipe", "inherit"] : "inherit",
		...execOptions,
	});
}

try {
	const npm = (args, options = {}) => run("npx", ["--yes", "npm@11.16.0", ...args], options);
	const npmVersion = npm(["--version"], { capture: true }).trim();
	if (npmVersion !== "11.16.0") {
		throw new Error(`Expected pinned npm 11.16.0 for the release smoke test; found npm ${npmVersion}`);
	}

	await import("node:fs/promises").then(({ mkdir }) => mkdir(packDir, { recursive: true }));
	const packEnv = { ...process.env };
	delete packEnv.npm_config_workspace;
	delete packEnv.npm_config_workspaces;
	const packOutput = npm(["pack", "--ignore-scripts", "--json", "--pack-destination", packDir], {
		capture: true,
		env: packEnv,
	});
	const parsed = JSON.parse(packOutput);
	const packed = Array.isArray(parsed) ? parsed[0] : Object.values(parsed)[0];
	if (!packed?.filename || !Array.isArray(packed.files)) {
		throw new Error("npm pack returned unexpected metadata");
	}
	if (!packed.files.some((file) => file.path === "npm-shrinkwrap.json")) {
		throw new Error("Packed Omukuumi tarball is missing npm-shrinkwrap.json");
	}
	if (packed.name !== packageJson.name || packed.version !== packageJson.version) {
		throw new Error(`Packed ${packed.name}@${packed.version}; expected ${packageJson.name}@${packageJson.version}`);
	}

	const tarball = join(packDir, packed.filename);
	npm(["install", "--global", "--prefix", prefix, tarball]);
	const bin = join(prefix, "bin", process.platform === "win32" ? "omukuumi.cmd" : "omukuumi");
	const version = run(bin, ["--version"], { cwd: workspace, capture: true }).trim();
	if (version !== packageJson.version) {
		throw new Error(`Installed CLI reported ${version}; expected ${packageJson.version}`);
	}
	run(bin, ["--help"], { cwd: workspace, capture: true });
	console.log(`Clean npm install smoke passed: ${packed.name}@${version}; ${packed.files.length} packed files`);
} finally {
	rmSync(workspace, { recursive: true, force: true });
}
