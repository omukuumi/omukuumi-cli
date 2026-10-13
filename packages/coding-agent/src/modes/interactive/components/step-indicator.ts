import type { Component, TUI } from "@earendil-works/pi-tui";
import { theme } from "../theme/theme.ts";

export type StepKind =
	| "idle"
	| "thinking"
	| "reading"
	| "writing"
	| "editing"
	| "running"
	| "searching"
	| "listing"
	| "grepping"
	| "tool_executing"
	| "compacting"
	| "waiting";

export interface StepInfo {
	kind: StepKind;
	message: string;
	toolName?: string;
	details?: string;
}

const STEP_ICONS: Record<StepKind, string> = {
	idle: "⏸",
	thinking: "💭",
	reading: "📖",
	writing: "✍️",
	editing: "✏️",
	running: "⚡",
	searching: "🔍",
	listing: "📋",
	grepping: "🔎",
	tool_executing: "⚙️",
	compacting: "📦",
	waiting: "⏳",
};

// Luganda words for each step (ONLY Luganda)
const STEP_LUGANDA: Record<StepKind, string> = {
	idle: "",
	thinking: "Kutekereza",
	reading: "Okusoma",
	writing: "Okwandiika",
	editing: "Okusasula",
	running: "Okukola",
	searching: "Okulonda",
	listing: "Okulondola",
	grepping: "Okulonda mu nnyo",
	tool_executing: "Okukolesha",
	compacting: "Okusindika",
	waiting: "",
};

export class StepIndicator implements Component {
	private currentStep: StepInfo = { kind: "idle", message: "" };
	private ui: TUI;

	constructor(ui: TUI) {
		this.ui = ui;
	}

	setStep(step: StepInfo): void {
		this.currentStep = step;
		this.ui.invalidate();
	}

	setIdle(): void {
		this.currentStep = { kind: "idle", message: "" };
		this.ui.invalidate();
	}

	setThinking(message = "Kutekereza..."): void {
		this.currentStep = { kind: "thinking", message };
		this.ui.invalidate();
	}

	setToolStep(toolName: string, details?: string): void {
		const kind = this.getToolKind(toolName);
		this.currentStep = {
			kind,
			message: this.getToolMessage(toolName),
			toolName,
			details,
		};
		this.ui.invalidate();
	}

	setCompacting(reason?: string): void {
		this.currentStep = {
			kind: "compacting",
			message: reason ? `Okusindika: ${reason}` : "Okusindika...",
		};
		this.ui.invalidate();
	}

	setIdleWithMessage(message: string): void {
		this.currentStep = { kind: "idle", message };
		this.ui.invalidate();
	}

	private getToolKind(toolName: string): StepKind {
		const toolLower = toolName.toLowerCase();
		if (toolLower.includes("read") || toolLower.includes("cat") || toolLower.includes("view")) return "reading";
		if (toolLower.includes("write") || toolLower.includes("create") || toolLower.includes("put")) return "writing";
		if (toolLower.includes("edit") || toolLower.includes("patch") || toolLower.includes("replace")) return "editing";
		if (
			toolLower.includes("bash") ||
			toolLower.includes("shell") ||
			toolLower.includes("run") ||
			toolLower.includes("exec")
		)
			return "running";
		if (
			toolLower.includes("grep") ||
			toolLower.includes("search") ||
			toolLower.includes("find") ||
			toolLower.includes("glob")
		)
			return "searching";
		if (toolLower.includes("list") || toolLower.includes("ls") || toolLower.includes("glob")) return "listing";
		if (toolLower.includes("grep") || toolLower.includes("rg")) return "grepping";
		return "tool_executing";
	}

	private getToolMessage(toolName: string): string {
		const kind = this.getToolKind(toolName);
		const luganda = STEP_LUGANDA[kind];
		return luganda;
	}

	invalidate(): void {
		// No cached state
	}

	render(width: number): string[] {
		const step = this.currentStep;
		const icon = STEP_ICONS[step.kind];
		const luganda = STEP_LUGANDA[step.kind];

		const prefix = `${icon} `;
		const message = step.message;
		const details = step.details ? ` (${step.details})` : "";

		// Format: icon + Luganda word + details
		const text = `${prefix}${luganda}${details ? ` ${details}` : ""}`;

		// Pad to width
		const visibleLength = text.replace(/\u001b\[[0-9;]*m/g, "").length;
		const padding = Math.max(0, width - visibleLength);
		return [`${text}${" ".repeat(padding)}`];
	}
}

export function createStepInfoFromToolEvent(event: {
	type: "tool_execution_start" | "tool_execution_update" | "tool_execution_end";
	toolName: string;
	toolCallId: string;
	details?: string;
}): StepInfo {
	if (event.type === "tool_execution_start") {
		return { kind: "tool_executing", message: `Okukolesha ${event.toolName}...`, toolName: event.toolName };
	}
	if (event.type === "tool_execution_update") {
		return {
			kind: "tool_executing",
			message: `Okukolesha ${event.toolName}...`,
			toolName: event.toolName,
			details: event.details,
		};
	}
	return { kind: "idle", message: `Kumaliza ${event.toolName}` };
}
