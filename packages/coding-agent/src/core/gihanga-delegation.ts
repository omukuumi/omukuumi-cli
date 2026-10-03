import { type ChildProcess, spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { AgentToolResult } from "@earendil-works/pi-agent-core";
import { type Static, Type } from "typebox";
import type { ToolDefinition } from "./extensions/types.ts";

const MAX_DEPTH = 2;
const MAX_CHILDREN = 3;
const MAX_OUTPUT_BYTES = 32_000;
const MAX_RUNTIME_MS = 120_000;
const BAR = "━━●━━━";

const spawnSchema = Type.Object({
	name: Type.Optional(Type.String({ description: "Short child name, for example gihanga-ntoya" })),
	task: Type.String({ description: "A focused independent task for the child agent" }),
	cwd: Type.Optional(Type.String({ description: "Working directory; defaults to the parent directory" })),
});

const idSchema = Type.Object({ id: Type.String({ description: "Child agent ID returned by spawn_gihanga" }) });

export type SpawnGihangaParams = Static<typeof spawnSchema>;
export type GihangaIdParams = Static<typeof idSchema>;

type ChildStatus = "starting" | "working" | "completed" | "failed" | "stopped";

interface ChildRecord {
	id: string;
	name: string;
	task: string;
	cwd: string;
	status: ChildStatus;
	process?: ChildProcess;
	timeout?: NodeJS.Timeout;
	output: string;
	exitCode?: number | null;
}

class GihangaChildManager {
	private readonly children = new Map<string, ChildRecord>();

	spawn(params: SpawnGihangaParams, parentCwd: string): ChildRecord {
		const depth = Number.parseInt(process.env.GIHANGA_AGENT_DEPTH ?? "0", 10);
		if (depth >= MAX_DEPTH) throw new Error(`Child-agent depth limit reached (${MAX_DEPTH}).`);
		const active = [...this.children.values()].filter(
			(child) => child.status === "starting" || child.status === "working",
		);
		if (active.length >= MAX_CHILDREN) throw new Error(`Child-agent limit reached (${MAX_CHILDREN}).`);
		const cwd = resolve(parentCwd, params.cwd ?? ".");
		if (!existsSync(cwd)) throw new Error(`Child working directory does not exist: ${cwd}`);

		const id = randomUUID();
		const child: ChildRecord = {
			id,
			name: params.name?.trim() || `gihanga-ntoya-${active.length + 1}`,
			task: params.task.trim(),
			cwd,
			status: "starting",
			output: "",
		};
		this.children.set(id, child);

		const entry = process.argv[1];
		if (!entry) throw new Error("Unable to locate the Gihanga executable for child process creation.");
		const childProcess = spawn(process.execPath, [entry, "--print", child.task], {
			cwd,
			stdio: ["ignore", "pipe", "pipe"],
			env: {
				...process.env,
				GIHANGA_AGENT_DEPTH: String(depth + 1),
				GIHANGA_PARENT_AGENT_ID: process.env.GIHANGA_AGENT_ID ?? "root",
				GIHANGA_AGENT_ID: id,
				GIHANGA_CHILD_AGENT: "1",
			},
		});
		child.process = childProcess;
		child.status = "working";
		if (!childProcess.stdout || !childProcess.stderr) throw new Error("Child Gihanga pipes were not created.");
		childProcess.stdout.setEncoding("utf8");
		childProcess.stderr.setEncoding("utf8");
		childProcess.stdout.on("data", (chunk: string) => {
			child.output = `${child.output}${chunk}`.slice(-MAX_OUTPUT_BYTES);
		});
		childProcess.stderr.on("data", (chunk: string) => {
			child.output = `${child.output}${chunk}`.slice(-MAX_OUTPUT_BYTES);
		});
		childProcess.once("error", (error) => {
			if (child.timeout) clearTimeout(child.timeout);
			child.status = "failed";
			child.output = `${child.output}\n${error.message}`.slice(-MAX_OUTPUT_BYTES);
		});
		childProcess.once("exit", (code) => {
			if (child.timeout) clearTimeout(child.timeout);
			child.exitCode = code;
			if (child.status !== "stopped" && child.status !== "failed")
				child.status = code === 0 ? "completed" : "failed";
		});
		child.timeout = setTimeout(() => {
			if (child.status !== "starting" && child.status !== "working") return;
			child.status = "failed";
			child.output = `${child.output}\nChild runtime limit reached (${MAX_RUNTIME_MS / 1000}s).`.slice(
				-MAX_OUTPUT_BYTES,
			);
			child.process?.kill("SIGTERM");
		}, MAX_RUNTIME_MS);
		return child;
	}

	get(id: string): ChildRecord {
		const child = this.children.get(id);
		if (!child) throw new Error(`Unknown child agent: ${id}`);
		return child;
	}

	stop(id: string): ChildRecord {
		const child = this.get(id);
		if (child.process && (child.status === "starting" || child.status === "working")) {
			child.status = "stopped";
			child.process.kill("SIGTERM");
		}
		return child;
	}

	list(): ChildRecord[] {
		return [...this.children.values()];
	}
}

const manager = new GihangaChildManager();

function ansi(hex: string, text: string): string {
	const value = hex.slice(1);
	const red = Number.parseInt(value.slice(0, 2), 16);
	const green = Number.parseInt(value.slice(2, 4), 16);
	const blue = Number.parseInt(value.slice(4, 6), 16);
	return `\x1b[38;2;${red};${green};${blue}m${text}\x1b[39m`;
}

function renderStatus(ctx: {
	ui: {
		setWidget(
			key: string,
			content: string[] | undefined,
			options?: { placement?: "aboveEditor" | "belowEditor" },
		): void;
	};
}): void {
	const children = manager.list();
	if (children.length === 0) {
		ctx.ui.setWidget("gihanga-agents", undefined, { placement: "aboveEditor" });
		return;
	}
	const lines = children.slice(-MAX_CHILDREN).map((child) => {
		const color =
			child.status === "completed"
				? "#20603D"
				: child.status === "failed" || child.status === "stopped"
					? "#DC3C3C"
					: "#E5BE01";
		const icon =
			child.status === "completed" ? "✓" : child.status === "failed" ? "!" : child.status === "stopped" ? "×" : "●";
		const bar =
			child.status === "working" || child.status === "starting"
				? BAR
				: child.status === "completed"
					? "━━━━━━━"
					: "XXXXXXX";
		return `${ansi(color, icon)} ${child.name} ${ansi(color, `[${bar}]`)} ${child.task.replace(/[\r\n	]+/g, " ").slice(0, 52)}`;
	});
	ctx.ui.setWidget("gihanga-agents", [`${ansi("#00A1DE", "Agents:")} ${lines.join("  │  ")}`], {
		placement: "aboveEditor",
	});
}

function result(text: string, details: unknown = undefined): AgentToolResult<unknown> {
	return { content: [{ type: "text", text }], details };
}

export function createGihangaDelegationTools(cwd: string): ToolDefinition[] {
	return [
		{
			name: "spawn_gihanga",
			label: "spawn Gihanga-Ntoya",
			description:
				"Create a focused child Gihanga for independent work. Use only when parallel investigation or a separate specialist will save time; do not use for simple tasks.",
			promptSnippet: "Delegate an independent task to a compact child Gihanga",
			promptGuidelines: [
				"Spawn a child only for independent, useful work; do not delegate simple edits.",
				"Give the child one focused task and request a concise result.",
				"Use get_gihanga_status or wait_gihanga to collect the child result.",
			],
			parameters: spawnSchema,
			executionMode: "sequential",
			async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
				const child = manager.spawn(params as SpawnGihangaParams, cwd);
				renderStatus(ctx);
				return result(
					`Started ${child.name} (${child.id}). Use wait_gihanga with this ID for its concise result.`,
					{ id: child.id, status: child.status },
				);
			},
		},
		{
			name: "get_gihanga_status",
			label: "get child status",
			description: "Check a child Gihanga status and receive only its compact current output.",
			parameters: idSchema,
			executionMode: "sequential",
			async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
				const child = manager.get((params as GihangaIdParams).id);
				renderStatus(ctx);
				return result(`${child.name}: ${child.status}\n${child.output.trim().slice(-4000) || "No result yet."}`, {
					id: child.id,
					status: child.status,
				});
			},
		},
		{
			name: "wait_gihanga",
			label: "wait for child Gihanga",
			description:
				"Wait for a child Gihanga to finish and return a concise result without exposing its full transcript.",
			parameters: idSchema,
			executionMode: "sequential",
			async execute(_toolCallId, params, signal, _onUpdate, ctx) {
				const child = manager.get((params as GihangaIdParams).id);
				while (child.status === "starting" || child.status === "working") {
					if (signal?.aborted) throw new Error("Waiting for child Gihanga was aborted.");
					renderStatus(ctx);
					await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
				}
				renderStatus(ctx);
				return result(
					`${child.name}: ${child.status}\n${child.output.trim().slice(-6000) || "No result returned."}`,
					{ id: child.id, status: child.status },
				);
			},
		},
		{
			name: "stop_gihanga",
			label: "stop child Gihanga",
			description: "Stop a running child Gihanga process.",
			parameters: idSchema,
			executionMode: "sequential",
			async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
				const child = manager.stop((params as GihangaIdParams).id);
				renderStatus(ctx);
				return result(`Stopped ${child.name} (${child.id}).`, { id: child.id, status: child.status });
			},
		},
	];
}
