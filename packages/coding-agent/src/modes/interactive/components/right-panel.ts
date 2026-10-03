import type { Component } from "@earendil-works/pi-tui";
import { truncateToWidth } from "@earendil-works/pi-tui";
import { theme } from "../theme/theme.ts";

/**
 * RightPanel — Right column (15%).
 * 3 sections with border separators, real scan data.
 *
 * Row 1 (30%): Time & Progression — date/time, session status, model info
 * Row 2 (30%): Packets — tcpdump / Wireshark capture summary
 * Row 3 (40%): WiFi — nmap / ARP device discovery
 */
export class RightPanel implements Component {
	private modelName: string;
	private contextPct: string;
	private costStr: string;
	private termRows: number;
	private loading: boolean[];

	private _wifiDevices: string[] = [];
	private _packetSummary: string = "No capture yet";
	private _findings: string[] = [];

	constructor(termRows = 24, modelName = "no-model", contextPct = "0%", costStr = "0 UGX") {
		this.termRows = termRows;
		this.modelName = modelName;
		this.contextPct = contextPct;
		this.costStr = costStr;
		this.loading = [false, false, false];
	}

	setModelInfo(model: string, pct: string, cost: string): void {
		this.modelName = model;
		this.contextPct = pct;
		this.costStr = cost;
	}

	setLoading(section: number, loading: boolean): void {
		if (section >= 0 && section < 3) this.loading[section] = loading;
	}

	setWifiDevices(devices: string[]): void {
		this._wifiDevices = devices;
	}
	setPacketSummary(s: string): void {
		this._packetSummary = s;
	}
	setFindings(f: string[]): void {
		this._findings = f;
	}

	invalidate(): void {}

	render(width: number): string[] {
		const t = (s: string) => truncateToWidth(s, width);
		const sep = theme.fg("muted", "\u2500".repeat(Math.max(2, width)));

		// Proportional heights
		const header = 5;
		const bordered = 2;
		const avail = Math.max(10, this.termRows - header - bordered);
		const h1 = Math.max(6, Math.floor(avail * 0.3));
		const h2 = Math.max(4, Math.floor(avail * 0.3));
		const h3 = Math.max(4, avail - h1 - h2);

		const lines: string[] = [
			t(theme.fg("accent", "Controls")),
			t(theme.fg("dim", "/copy  (copy last msg)")),
			t(theme.fg("dim", "/export (export all)")),
			t(theme.fg("dim", "/copy 0-9 (line range)")),
			"",
		];

		// ── Section 1: Time & Progression (30%) ────────────────
		const now = new Date();
		const hh = String(now.getHours()).padStart(2, "0");
		const mm = String(now.getMinutes()).padStart(2, "0");
		const ss = String(now.getSeconds()).padStart(2, "0");
		const timeStr = `${hh}:${mm}:${ss}`;
		const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
		const dateStr = `${months[now.getMonth()]} ${now.getDate()}`;

		const s1: string[] = [
			t(theme.fg("accent", "Time & Progression")),
			t(theme.fg("accent", "  " + timeStr)),
			t(theme.fg("dim", "  " + dateStr)),
			t(theme.fg("muted", "  Session: active")),
			t(theme.fg("dim", "  Model: " + this.modelName)),
			t(theme.fg("dim", "  " + this.contextPct + " / " + this.costStr)),
		];
		lines.push(...s1);
		while (lines.length < header + h1) lines.push("");
		lines.push(t(sep));

		// ── Section 2: Packets (30%) ────────────────────────────
		const s2: string[] = [t(theme.fg("accent", "Packets")), t(theme.fg("muted", "  tcpdump / Wireshark"))];
		if (this._packetSummary) {
			s2.push(t(theme.fg("dim", "  " + this._packetSummary)));
		} else {
			s2.push(t(theme.fg("dim", "  No capture yet")));
		}
		s2.push(t(theme.fg("dim", "  [capture / analyze]")));
		while (lines.length < header + h1 + 1) lines.push("");
		lines.push(...s2);
		while (lines.length < header + h1 + 1 + h2) lines.push("");
		lines.push(t(sep));

		// ── Section 3: WiFi (40%) ──────────────────────────────
		const s3: string[] = [t(theme.fg("accent", "WiFi")), t(theme.fg("muted", "  nmap / ARP"))];
		if (this._wifiDevices.length > 0) {
			const maxLines = Math.max(1, h3 - 3);
			const shown = this._wifiDevices.slice(0, maxLines);
			for (const d of shown) {
				s3.push(t(theme.fg("dim", "  " + d)));
			}
			if (this._wifiDevices.length > maxLines) {
				s3.push(t(theme.fg("dim", `  ... +${this._wifiDevices.length - maxLines} more`)));
			}
		} else {
			s3.push(t(theme.fg("dim", "  No devices yet")));
		}
		s3.push(t(theme.fg("dim", "  [scan / list]")));
		while (lines.length < header + h1 + 1 + h2 + 1) lines.push("");
		lines.push(...s3);
		while (lines.length < header + h1 + 1 + h2 + 1 + h3) lines.push("");

		return lines;
	}
}
