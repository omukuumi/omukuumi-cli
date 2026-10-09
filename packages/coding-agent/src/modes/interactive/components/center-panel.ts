import type { Component, Terminal } from "@earendil-works/pi-tui";
import { truncateToWidth } from "@earendil-works/pi-tui";
import { theme } from "../theme/theme.ts";

const LOGO = [
	"   ___  __  __ _   _ _  ___   ___   ___  _ __ ___ (_)",
	"  / _ \\|  \\/  | | | | |/ / | | \\ \\ / / _ \\| '_ \\` _ \\| |",
	" | (_) | |\\/| | |_| | ' <| |_| |\\ V / (_) | | | | | | |",
	"  \\___/|_|  |_|\\___/|_|\\_\\\\___/  \\_/ \\___/|_| |_| |_|_|",
];

/**
 * CenterPanel — main workspace column.
 *
 * Layout:
 *   [Scrollable content area — fills all available space]
 *     - Omukuumi ASCII logo + sponsorship (scrolls away)
 *     - Chat messages, logs, tool output
 *   [Fixed input — permanently at bottom]
 *
 * The input is rendered outside the scrollable container so it
 * never moves when the user scrolls through content.
 */
export class CenterPanel implements Component {
	private contentChild: Component;
	private editorChild: Component;
	private terminal: Terminal;

	// Auto-scroll state
	private autoScroll: boolean = true;
	private pendingNewOutput: boolean = false;
	private lastScrollOffset: number = 0;

	constructor(contentChild: Component, editorChild: Component, terminal: Terminal) {
		this.contentChild = contentChild;
		this.editorChild = editorChild;
		this.terminal = terminal;
	}

	markNewOutput(): void {
		if (!this.autoScroll) this.pendingNewOutput = true;
	}

	handleScroll(direction: "up" | "down"): void {
		const step = 3;
		if (direction === "up") {
			this.lastScrollOffset = Math.max(0, this.lastScrollOffset - step);
			this.autoScroll = false;
		} else {
			this.lastScrollOffset += step;
			this.autoScroll = false;
		}
	}

	pageUp(): void {
		this.lastScrollOffset = Math.max(0, this.lastScrollOffset - 10);
		this.autoScroll = false;
	}
	pageDown(): void {
		this.lastScrollOffset += 10;
		this.autoScroll = false;
	}
	scrollToTop(): void {
		this.lastScrollOffset = 0;
		this.autoScroll = false;
	}
	scrollToBottom(): void {
		this.autoScroll = true;
		this.pendingNewOutput = false;
	}
	isUserAtBottom(): boolean {
		return this.autoScroll;
	}

	invalidate(): void {
		this.contentChild.invalidate?.();
		this.editorChild.invalidate?.();
	}

	render(width: number): string[] {
		const t = (s: string) => truncateToWidth(s, width);
		const termRows = this.terminal.rows || 24;

		// ── Build the logo block (part of scrollable content) ───
		const logoBlock: string[] = [];
		for (const line of LOGO) {
			logoBlock.push(t(theme.fg("accent", line)));
		}
		logoBlock.push(t(theme.fg("dim", "Sponsored by Genesis Codeworks Ltd")));
		logoBlock.push("");

		// ── Render editor to know its height ────────────────────
		const editorLines = this.editorChild.render(width);
		const editorBlock: string[] = [];
		editorBlock.push(""); // blank above
		editorBlock.push(...editorLines);
		editorBlock.push(""); // blank below
		const editorHeight = editorBlock.length;

		// ── Full scrollable content (logo + messages) ───────────
		const rawMessages = this.contentChild.render(width);
		const fullContent = [...logoBlock, ...rawMessages];
		const contentMaxHeight = Math.max(10, termRows - editorHeight);

		// ── Scroll offset ──────────────────────────────────────
		const isAtBottom = this.autoScroll || fullContent.length <= contentMaxHeight;
		let scrollOffset = isAtBottom ? Math.max(0, fullContent.length - contentMaxHeight) : this.lastScrollOffset;

		const maxOffset = Math.max(0, fullContent.length - contentMaxHeight);
		scrollOffset = Math.max(0, Math.min(scrollOffset, maxOffset));
		this.lastScrollOffset = scrollOffset;

		if (scrollOffset >= maxOffset) {
			this.autoScroll = true;
			this.pendingNewOutput = false;
		}

		const visible = fullContent.slice(scrollOffset, scrollOffset + contentMaxHeight);

		// ── "↓ New output" indicator ────────────────────────────
		if (this.pendingNewOutput) {
			visible.push(t(theme.fg("warning", "  \u2193 New output  (End to follow)")));
		}

		// ── Assemble final result ──────────────────────────────
		const result: string[] = [...visible.slice(0, contentMaxHeight)];

		// Pad to fill remaining content area
		while (result.length < contentMaxHeight) result.push("");

		result.push(...editorBlock);
		return result;
	}
}
