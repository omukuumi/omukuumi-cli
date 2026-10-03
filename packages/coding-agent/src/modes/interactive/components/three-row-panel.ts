import type { Component } from "@earendil-works/pi-tui";
import { theme } from "../theme/theme.ts";

/**
 * ThreeRowPanel - Right column (15%): 3 vertically stacked rows.
 * Row 1: Findings, Vulnerability and Problems in System.
 * Row 2: Devices that need updates.
 * Row 3: Incident Operations.
 */
export class ThreeRowPanel implements Component {
	private findings: string[];
	private devices: string[];
	private incidents: string[];

	constructor(findings?: string[], devices?: string[], incidents?: string[]) {
		this.findings = findings ?? [];
		this.devices = devices ?? [];
		this.incidents = incidents ?? [];
	}

	invalidate(): void {}

	render(width: number): string[] {
		const lines: string[] = [];

		// Row 1: Findings, Vulnerability and Problems
		lines.push(theme.fg("error", "VULNS"));
		lines.push(theme.fg("muted", "Findings & Problems"));
		if (this.findings.length === 0) {
			lines.push(theme.fg("dim", "  No findings"));
		} else {
			for (const f of this.findings) {
				lines.push(theme.fg("text", trunc(f, width)));
			}
		}
		lines.push("");
		lines.push(theme.fg("muted", "---"));

		// Row 2: Devices that need updates
		lines.push("");
		lines.push(theme.fg("warning", "UPDATES"));
		lines.push(theme.fg("muted", "Devices Needing Updates"));
		if (this.devices.length === 0) {
			lines.push(theme.fg("dim", "  No devices"));
		} else {
			for (const d of this.devices) {
				lines.push(theme.fg("text", trunc(d, width)));
			}
		}
		lines.push("");
		lines.push(theme.fg("muted", "---"));

		// Row 3: Incident Operations
		lines.push("");
		lines.push(theme.fg("accent", "INCIDENTS"));
		lines.push(theme.fg("muted", "Incident Operations"));
		if (this.incidents.length === 0) {
			lines.push(theme.fg("dim", "  No incidents"));
		} else {
			for (const i of this.incidents) {
				lines.push(theme.fg("text", trunc(i, width)));
			}
		}
		lines.push("");

		return lines;
	}
}

function trunc(s: string, w: number): string {
	if (s.length <= w) return s;
	return s.slice(0, Math.max(0, w - 3)) + "...";
}
