import { type ChildProcess, spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { AgentToolResult } from "@earendil-works/pi-agent-core";
import { type Static, Type } from "typebox";
import type { ToolDefinition } from "./extensions/types.ts";

const MAX_DEPTH = 2;
const MAX_CHILDREN = 3;
const MAX_RETAINED_CHILDREN = 20;
const MAX_OUTPUT_BYTES = 32_000;
const MAX_PANEL_OUTPUT_CHARS = 480;
const MAX_RUNTIME_MS = 120_000;

function sanitizeTerminalText(value: string): string {
	return value
		.replace(/\u001b(?:\[[0-?]*[ -/]*[@-~]|\][^\u0007]*(?:\u0007|\u001b\\))/g, "")
		.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "");
}

const spawnSchema = Type.Object({
	name: Type.Optional(Type.String({ description: "Optional short task label for the Mini-Omukuumi child" })),
	task: Type.String({ description: "A focused independent task for the child agent" }),
	cwd: Type.Optional(Type.String({ description: "Working directory; defaults to the parent directory" })),
});

const idSchema = Type.Object({ id: Type.String({ description: "Child agent ID returned by spawn_mini_omukuumi" }) });

export type SpawnMiniOmukuumiParams = Static<typeof spawnSchema>;
export type MiniOmukuumiIdParams = Static<typeof idSchema>;

type ChildStatus = "starting" | "working" | "completed" | "failed" | "stopped";

export interface MiniOmukuumiSnapshot {
	id: string;
	name: string;
	task: string;
	status: ChildStatus;
	output: string;
}

type MiniOmukuumiListener = (children: MiniOmukuumiSnapshot[]) => void;
const miniOmukuumiListeners = new Set<MiniOmukuumiListener>();

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

class MiniOmukuumiManager {
	private readonly children = new Map<string, ChildRecord>();

	spawn(params: SpawnMiniOmukuumiParams, parentCwd: string): ChildRecord {
		const depth = Number.parseInt(process.env.MINI_OMUKUUMI_AGENT_DEPTH ?? "0", 10);
		if (depth >= MAX_DEPTH) throw new Error(`Mini-Omukuumi depth limit reached (${MAX_DEPTH}).`);
		const active = [...this.children.values()].filter(
			(child) => child.status === "starting" || child.status === "working",
		);
		if (active.length >= MAX_CHILDREN) throw new Error(`Mini-Omukuumi limit reached (${MAX_CHILDREN}).`);
		const cwd = resolve(parentCwd, params.cwd ?? ".");
		if (!existsSync(cwd)) throw new Error(`Child working directory does not exist: ${cwd}`);

		for (const child of this.children.values()) {
			if (child.status !== "starting" && child.status !== "working") this.children.delete(child.id);
			if (this.children.size < MAX_RETAINED_CHILDREN) break;
		}

		const id = randomUUID();
		const child: ChildRecord = {
			id,
			name: params.name?.trim()
				? `Mini-Omukuumi ${sanitizeTerminalText(params.name.trim()).replace(/[\r\n\t]+/g, " ").slice(0, 36)}`
				: `Mini-Omukuumi-${active.length + 1}`,
			task: sanitizeTerminalText(params.task.trim()),
			cwd,
			status: "starting",
			output: "",
		};
		this.children.set(id, child);

		const entry = process.argv[1];
		if (!entry) throw new Error("Unable to locate the Omukuumi executable for child process creation.");
		const childProcess = spawn(process.execPath, [entry, "--print", child.task], {
			cwd,
			stdio: ["ignore", "pipe", "pipe"],
			env: {
				...process.env,
				...process.env,
				MINI_OMUKUUMI_AGENT_DEPTH: String(depth + 1),
				MINI_OMUKUUMI_PARENT_AGENT_ID: process.env.MINI_OMUKUUMI_AGENT_ID ?? "root",
				MINI_OMUKUUMI_AGENT_ID: id,
				MINI_OMUKUUMI_CHILD_AGENT: "1",
			},
		});
		child.process = childProcess;
		child.status = "working";
		publishMiniOmukuumiSnapshots(this.list());
		if (!childProcess.stdout || !childProcess.stderr) throw new Error("Mini-Omukuumi output pipes were not created.");
		childProcess.stdout.setEncoding("utf8");
		childProcess.stderr.setEncoding("utf8");
		const appendOutput = (chunk: string) => {
			child.output = `${child.output}${chunk}`.slice(-MAX_OUTPUT_BYTES);
			publishMiniOmukuumiSnapshots(this.list());
		};
		childProcess.stdout.on("data", appendOutput);
		childProcess.stderr.on("data", appendOutput);
		childProcess.once("error", (error) => {
			if (child.timeout) clearTimeout(child.timeout);
			child.status = "failed";
			child.output = `${child.output}\n${error.message}`.slice(-MAX_OUTPUT_BYTES);
			publishMiniOmukuumiSnapshots(this.list());
		});
		childProcess.once("exit", (code) => {
			if (child.timeout) clearTimeout(child.timeout);
			child.exitCode = code;
			if (child.status !== "stopped" && child.status !== "failed")
				child.status = code === 0 ? "completed" : "failed";
			publishMiniOmukuumiSnapshots(this.list());
		});
		child.timeout = setTimeout(() => {
			if (child.status !== "starting" && child.status !== "working") return;
			child.status = "failed";
			child.output = `${child.output}\nMini-Omukuumi runtime limit reached (${MAX_RUNTIME_MS / 1000}s).`.slice(
				-MAX_OUTPUT_BYTES,
			);
			child.process?.kill("SIGTERM");
			publishMiniOmukuumiSnapshots(this.list());
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
			publishMiniOmukuumiSnapshots(this.list());
		}
		return child;
	}

	list(): ChildRecord[] {
		return [...this.children.values()];
	}
}

const manager = new MiniOmukuumiManager();

function snapshotChildren(children: ChildRecord[]): MiniOmukuumiSnapshot[] {
	return children.slice(-MAX_CHILDREN).map((child) => ({
		id: child.id,
		name: child.name,
		task: child.task,
		status: child.status,
		output: sanitizeTerminalText(child.output).slice(-MAX_PANEL_OUTPUT_CHARS),
	}));
}

function publishMiniOmukuumiSnapshots(children: ChildRecord[]): void {
	const snapshots = snapshotChildren(children);
	for (const listener of miniOmukuumiListeners) listener(snapshots);
}

export function subscribeMiniOmukuumiSnapshots(listener: MiniOmukuumiListener): () => void {
	miniOmukuumiListeners.add(listener);
	listener(snapshotChildren(manager.list()));
	return () => miniOmukuumiListeners.delete(listener);
}

function result(text: string, details: unknown = undefined): AgentToolResult<unknown> {
	return { content: [{ type: "text", text }], details };
}

export function createMiniOmukuumiTools(cwd: string): ToolDefinition[] {
	return [
		{
			name: "spawn_mini_omukuumi",
			label: "spawn Mini-Omukuumi",
			description:
				"Start a focused Mini-Omukuumi child agent for independent work. Use when parallel investigation or a specialist saves time; do not use for simple tasks.",
			promptSnippet: "Delegate a focused task to a Mini-Omukuumi child agent",
			promptGuidelines: [
				"Spawn a Mini-Omukuumi child only for independent, useful work; do not use for simple tasks.",
				"Give the child one focused task and request a concise result.",
				"Use get_mini_omukuumi_status or wait_mini_omukuumi to collect the child result.",
			],
			parameters: spawnSchema,
			executionMode: "sequential",
			async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
				const child = manager.spawn(params as SpawnMiniOmukuumiParams, cwd);
				return result(
					`Started ${child.name} (${child.id}). Use wait_mini_omukuumi with this ID for its concise result.`,
					{ id: child.id, status: child.status },
				);
			},
		},
		{
			name: "get_mini_omukuumi_status",
			label: "get Mini-Omukuumi status",
			description: "Check a Mini-Omukuumi child status and receive its compact current output.",
			parameters: idSchema,
			executionMode: "sequential",
			async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
				const child = manager.get((params as MiniOmukuumiIdParams).id);
				return result(`${child.name}: ${child.status}\n${child.output.trim().slice(-4000) || "No result yet."}`, {
					id: child.id,
					status: child.status,
				});
			},
		},
		{
			name: "wait_mini_omukuumi",
			label: "wait for Mini-Omukuumi",
			description:
				"Wait for a Mini-Omukuumi child to finish and return a concise result without exposing its full transcript.",
			parameters: idSchema,
			executionMode: "sequential",
			async execute(_toolCallId, params, signal, _onUpdate, _ctx) {
				const child = manager.get((params as MiniOmukuumiIdParams).id);
				while (child.status === "starting" || child.status === "working") {
					if (signal?.aborted) throw new Error("Waiting for Mini-Omukuumi was aborted.");
					await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
				}
				return result(
					`${child.name}: ${child.status}\n${child.output.trim().slice(-6000) || "No result returned."}`,
					{ id: child.id, status: child.status },
				);
			},
		},
		{
			name: "stop_mini_omukuumi",
			label: "stop Mini-Omukuumi",
			description: "Stop a running Mini-Omukuumi child process.",
			parameters: idSchema,
			executionMode: "sequential",
			async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
				const child = manager.stop((params as MiniOmukuumiIdParams).id);
				return result(`Stopped ${child.name} (${child.id}).`, { id: child.id, status: child.status });
			},
		},
	];
}
