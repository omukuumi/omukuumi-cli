import type { Component, Terminal } from "@earendil-works/pi-tui";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import { theme } from "../theme/theme.ts";

interface SidebarLayoutOptions {
	leftColumn: Component;
	centerColumn: Component;
	rightColumn: Component;
	terminal: Terminal;
}

export class SidebarLayout implements Component {
	private leftColumn: Component;
	private centerColumn: Component;
	private rightColumn: Component;
	private terminal: Terminal;

	constructor(options: SidebarLayoutOptions) {
		this.leftColumn = options.leftColumn;
		this.centerColumn = options.centerColumn;
		this.rightColumn = options.rightColumn;
		this.terminal = options.terminal;
	}
	invalidate(): void {}
	handleScroll(direction: "up" | "down"): void {
		if (typeof (this.leftColumn as any).handleScroll === "function") (this.leftColumn as any).handleScroll(direction);
		if (typeof (this.centerColumn as any).handleScroll === "function")
			(this.centerColumn as any).handleScroll(direction);
		if (typeof (this.rightColumn as any).handleScroll === "function")
			(this.rightColumn as any).handleScroll(direction);
	}
	render(width: number): string[] {
		const sep = theme.fg("border", "\u2502");
		const contentW = width - 2;
		const c1 = Math.max(3, Math.floor(contentW * 0.2));
		let c2 = Math.max(3, Math.floor(contentW * 0.65));
		let c3 = contentW - c1 - c2;
		if (c3 < 3) {
			c3 = 3;
			c2 = contentW - c1 - c3;
		}
		const leftovers = width - (c1 + c2 + c3 + 2);
		c2 += leftovers;

		const l1 = this.leftColumn.render(c1);
		const l2 = this.centerColumn.render(c2);
		const l3 = this.rightColumn.render(c3);

		const N = Math.max(l1.length, l2.length, l3.length, this.terminal.rows || 24);
		const out: string[] = [];
		for (let i = 0; i < N; i++) {
			const a = get(l1, i, c1);
			const b = get(l2, i, c2);
			const c = get(l3, i, c3);
			out.push(a + sep + b + sep + c);
		}
		return out;
	}
}

function get(ls: string[], idx: number, w: number): string {
	if (idx >= ls.length) return " ".repeat(w);
	const s = ls[idx];
	const vw = visibleWidth(s);
	if (vw > w) return truncateToWidth(s, w);
	if (vw < w) return s + " ".repeat(w - vw);
	return s;
}
