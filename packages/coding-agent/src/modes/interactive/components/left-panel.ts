import type { Component } from "@earendil-works/pi-tui";
import { truncateToWidth } from "@earendil-works/pi-tui";
import { theme } from "../theme/theme.ts";

/**
 * LeftPanel - Left column (20%).
 * Section 1 (30%): VULNS — Findings, Vulnerability and Problems in System
 * Section 2 (30%): UPDATES — Devices that need updates
 * Section 3 (40%): INCIDENTS — Incident Operations
 *
 * Real data from live scans populates each section.
 */
export class LeftPanel implements Component {
	private termRows: number;
	private _findings: string[] = [];
	private _updates: string[] = [];
	private _incidents: string[] = [];

	constructor(termRows = 24) {
		this.termRows = termRows;
	}

	setFindings(f: string[]): void {
		this._findings = f;
	}
	setUpdates(u: string[]): void {
		this._updates = u;
	}
	setIncidents(i: string[]): void {
		this._incidents = i;
	}

	invalidate(): void {}

	render(width: number): string[] {
		const t = (s: string) => truncateToWidth(s, width);

		const sec1: string[] = [
			t(theme.fg("error", "1. VULNS")),
			t(theme.fg("muted", "Findings & Problems")),
			...(this._findings.length > 0
				? this._findings.map((f) => t(theme.fg("dim", "  " + f)))
				: [t(theme.fg("dim", "  No findings"))]),
		];
		const sec2: string[] = [
			t(theme.fg("warning", "2. UPDATES")),
			t(theme.fg("muted", "Devices needing updates")),
			...(this._updates.length > 0
				? this._updates.map((u) => t(theme.fg("dim", "  " + u)))
				: [t(theme.fg("dim", "  No devices"))]),
		];
		const sec3: string[] = [
			t(theme.fg("accent", "3. INCIDENTS")),
			t(theme.fg("muted", "Incident Operations")),
			...(this._incidents.length > 0
				? this._incidents.map((inc) => t(theme.fg("dim", "  " + inc)))
				: [t(theme.fg("dim", "  No incidents"))]),
		];

		const header = 4;
		const avail = Math.max(6, this.termRows - header - 2);
		const h1 = Math.max(sec1.length, Math.floor(avail * 0.3));
		const h2 = Math.max(sec2.length, Math.floor(avail * 0.3));
		const h3 = Math.max(sec3.length, avail - h1 - h2);

		let wave = "";
		for (let i = 0; i < width; i++) wave += i % 2 === 0 ? "/" : "\\";
		const lines: string[] = [
			t(theme.fg("accent", wave)),
			t(theme.bold(theme.fg("accent", "OMUKUUMI"))),
			t(theme.fg("dim", "Skills & Extensions")),
			"",
		];

		lines.push(...sec1);
		while (lines.length < header + h1) lines.push("");
		lines.push(t(theme.fg("muted", "." + "\u2500".repeat(Math.max(1, width - 2)))));
		while (lines.length < header + h1 + 1) lines.push("");
		lines.push(...sec2);
		while (lines.length < header + h1 + 1 + h2) lines.push("");
		lines.push(t(theme.fg("muted", "." + "\u2500".repeat(Math.max(1, width - 2)))));
		while (lines.length < header + h1 + 1 + h2 + 1) lines.push("");
		lines.push(...sec3);
		while (lines.length < header + h1 + 1 + h2 + 1 + h3) lines.push("");

		return lines;
	}
}
