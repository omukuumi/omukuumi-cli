import type { Component } from "@earendil-works/pi-tui";
import { truncateToWidth } from "@earendil-works/pi-tui";
import type { MiniOmukuumiSnapshot } from "../../../core/mini-omukuumi-delegation.ts";
import { theme } from "../theme/theme.ts";

/** Right sidebar for run controls and live Mini-Omukuumi child-agent output. */
export class RightPanel implements Component {
	private modelName: string;
	private contextPct: string;
	private costStr: string;
	private termRows: number;
	private miniAgents: MiniOmukuumiSnapshot[] = [];

	constructor(termRows = 24, modelName = "no-model", contextPct = "0%", costStr = "0 UGX") {
		this.termRows = termRows;
		this.modelName = modelName;
		this.contextPct = contextPct;
		this.costStr = costStr;
	}

	setModelInfo(model: string, pct: string, cost: string): void {
		this.modelName = model;
		this.contextPct = pct;
		this.costStr = cost;
	}

	setMiniAgents(agents: MiniOmukuumiSnapshot[]): void {
		this.miniAgents = agents;
	}

	invalidate(): void {}

	render(width: number): string[] {
		const t = (value: string) => truncateToWidth(value, width);
		const lines = [
			t(theme.fg("accent", "Omukuumi")),
			t(theme.fg("dim", "/copy · /export")),
			"",
			t(theme.fg("accent", "Session")),
			t(theme.fg("dim", `Model: ${this.modelName}`)),
			t(theme.fg("dim", `Context: ${this.contextPct}`)),
			t(theme.fg("dim", `Cost: ${this.costStr}`)),
			"",
			t(theme.fg("accent", `Mini-Omukuumi (${this.miniAgents.length})`)),
		];

		const availableLines = Math.max(0, (this.termRows || 24) - lines.length - 1);
		if (this.miniAgents.length === 0) {
			lines.push(t(theme.fg("dim", "No child agents running")));
		} else {
			const perAgentBudget = Math.max(3, Math.floor(availableLines / this.miniAgents.length));
			for (const agent of this.miniAgents) {
				const statusColor =
					agent.status === "completed"
						? "success"
						: agent.status === "failed" || agent.status === "stopped"
							? "error"
							: "warning";
				lines.push(t(theme.fg(statusColor, `${agent.status.toUpperCase()} · ${agent.name}`)));
				lines.push(t(theme.fg("muted", `  ${agent.task.replace(/[\r\n\t]+/g, " ")}`)));
				const outputLines = agent.output.split(/\r?\n/).filter(Boolean);
				const logBudget = Math.max(1, perAgentBudget - 2);
				const visibleLogs = outputLines.slice(-logBudget);
				if (visibleLogs.length === 0) {
					lines.push(t(theme.fg("dim", "  Waiting for output...")));
				} else {
					for (const logLine of visibleLogs) lines.push(t(theme.fg("dim", `  ${logLine}`)));
				}
			}
		}

		const height = Math.max(this.termRows || 24, lines.length);
		while (lines.length < height) lines.push("");
		return lines;
	}
}
