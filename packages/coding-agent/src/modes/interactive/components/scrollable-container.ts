import type { Component } from "@earendil-works/pi-tui";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

interface ScrollableContainerOptions {
	/** Child component to wrap */
	child: Component;
	/** Maximum height in lines (optional, defaults to available space) */
	maxHeight?: number;
	/** Show scroll indicators */
	showScrollIndicators?: boolean;
}

/**
 * ScrollableContainer - Wraps a child component and allows vertical scrolling
 * with keyboard navigation (Page Up/Down, Home/End)
 */
export class ScrollableContainer implements Component {
	private child: Component;
	private maxHeight: number | undefined;
	private showScrollIndicators: boolean;
	private scrollOffset = 0;
	private lastRenderHeight = 0;
	private lastContentLines: string[] = [];

	constructor(options: ScrollableContainerOptions) {
		this.child = options.child;
		this.maxHeight = options.maxHeight;
		this.showScrollIndicators = options.showScrollIndicators ?? true;
	}

	invalidate(): void {
		this.child.invalidate?.();
		this.lastContentLines = [];
	}

	/** Scroll up by n lines */
	scrollUp(lines: number = 1): void {
		this.scrollOffset = Math.max(0, this.scrollOffset - lines);
	}

	/** Mouse scroll handler */
	handleScroll(direction: "up" | "down"): void {
		if (direction === "up") {
			this.scrollUp(3);
		} else {
			this.scrollDown(3);
		}
	}

	/** Scroll down by n lines */
	scrollDown(lines: number = 1): void {
		const maxScroll = Math.max(0, this.lastContentLines.length - (this.maxHeight || this.lastRenderHeight));
		this.scrollOffset = Math.min(maxScroll, this.scrollOffset + lines);
	}

	/** Scroll to top */
	scrollToTop(): void {
		this.scrollOffset = 0;
	}

	/** Scroll to bottom */
	scrollToBottom(): void {
		const maxScroll = Math.max(0, this.lastContentLines.length - (this.maxHeight || this.lastRenderHeight));
		this.scrollOffset = maxScroll;
	}

	/** Page up */
	pageUp(): void {
		const pageSize = (this.maxHeight || this.lastRenderHeight) - 1;
		this.scrollUp(pageSize > 0 ? pageSize : 1);
	}

	/** Page down */
	pageDown(): void {
		const pageSize = (this.maxHeight || this.lastRenderHeight) - 1;
		this.scrollDown(pageSize > 0 ? pageSize : 1);
	}

	render(width: number): string[] {
		// Render child at full width (no horizontal scrolling)
		const childLines = this.child.render(width);
		this.lastContentLines = childLines;
		this.lastRenderHeight = this.maxHeight || childLines.length;

		if (childLines.length === 0) {
			return [];
		}

		// If no height constraint or content fits, render all
		if (!this.maxHeight || childLines.length <= this.maxHeight) {
			return childLines;
		}

		// Clamp scroll offset
		const maxScroll = Math.max(0, childLines.length - this.maxHeight);
		this.scrollOffset = Math.min(this.scrollOffset, maxScroll);

		// Get visible lines
		const visibleLines = childLines.slice(this.scrollOffset, this.scrollOffset + this.maxHeight);

		const result: string[] = [];

		// Top scroll indicator
		if (this.showScrollIndicators && this.scrollOffset > 0) {
			const indicator = `─── ↑ ${this.scrollOffset} more ───`;
			result.push(truncateToWidth(indicator, width, "..."));
		}

		// Visible content
		for (const line of visibleLines) {
			result.push(line);
		}

		// Bottom scroll indicator
		const linesBelow = childLines.length - (this.scrollOffset + visibleLines.length);
		if (this.showScrollIndicators && linesBelow > 0) {
			const indicator = `─── ↓ ${linesBelow} more ───`;
			result.push(truncateToWidth(indicator, width, "..."));
		}

		return result;
	}
}
