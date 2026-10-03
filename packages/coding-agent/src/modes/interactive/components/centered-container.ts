import type { Component } from "@earendil-works/pi-tui";
import { visibleWidth } from "@earendil-works/pi-tui";
import { type ThemeColor, theme } from "../theme/theme.ts";

interface CenteredContainerOptions {
	/** Child component to wrap */
	child: Component;
	/** Left margin as percentage (0-100), default 20 */
	leftMarginPercent?: number;
	/** Right margin as percentage (0-100), default 20 */
	rightMarginPercent?: number;
	/** Border style: "rounded" | "sharp" | "double" | "minimal", default "rounded" */
	borderStyle?: "rounded" | "sharp" | "double" | "minimal";
	/** Border color theme key, default "border" */
	borderColor?: ThemeColor;
}

/**
 * CenteredContainer - Wraps a child component with configurable margins and vertical borders
 * Supports multiple border styles with theme-aware colors
 */
export class CenteredContainer implements Component {
	private child: Component;
	private leftMarginPercent: number;
	private rightMarginPercent: number;
	private borderStyle: "rounded" | "sharp" | "double" | "minimal";
	private borderColor: ThemeColor;

	// Border character sets
	private static readonly BORDER_CHARS = {
		rounded: {
			topLeft: "╭",
			topRight: "╮",
			bottomLeft: "╰",
			bottomRight: "╯",
			horizontal: "─",
			vertical: "│",
		},
		sharp: {
			topLeft: "┌",
			topRight: "┐",
			bottomLeft: "└",
			bottomRight: "┘",
			horizontal: "─",
			vertical: "│",
		},
		double: {
			topLeft: "╔",
			topRight: "╗",
			bottomLeft: "╚",
			bottomRight: "╝",
			horizontal: "═",
			vertical: "║",
		},
		minimal: {
			topLeft: " ",
			topRight: " ",
			bottomLeft: " ",
			bottomRight: " ",
			horizontal: " ",
			vertical: "│",
		},
	} as const;

	constructor(options: CenteredContainerOptions) {
		this.child = options.child;
		this.leftMarginPercent = options.leftMarginPercent ?? 20;
		this.rightMarginPercent = options.rightMarginPercent ?? 20;
		this.borderStyle = options.borderStyle ?? "rounded";
		this.borderColor = options.borderColor ?? "border";
	}

	invalidate(): void {
		this.child.invalidate?.();
	}

	private getBorderChar(key: keyof typeof CenteredContainer.BORDER_CHARS.rounded): string {
		return CenteredContainer.BORDER_CHARS[this.borderStyle][key];
	}

	private styleBorder(text: string): string {
		// Use the theme proxy which resolves colors at call time
		return theme.fg(this.borderColor, text);
	}

	render(width: number): string[] {
		// Calculate margins
		const leftMargin = Math.floor((width * this.leftMarginPercent) / 100);
		const rightMargin = Math.floor((width * this.rightMarginPercent) / 100);
		const borderWidth = this.borderStyle === "minimal" ? 1 : 2;
		const contentWidth = Math.max(1, width - leftMargin - rightMargin - borderWidth);

		// Render child at content width
		const childLines = this.child.render(contentWidth);

		if (childLines.length === 0) {
			return [];
		}

		const result: string[] = [];
		const leftPad = " ".repeat(leftMargin);
		const rightPad = " ".repeat(rightMargin);
		const hChar = this.getBorderChar("horizontal");
		const vChar = this.getBorderChar("vertical");

		// Top border
		if (this.borderStyle !== "minimal") {
			const topBorder = this.styleBorder(
				leftPad +
					this.getBorderChar("topLeft") +
					hChar.repeat(contentWidth) +
					this.getBorderChar("topRight") +
					rightPad,
			);
			result.push(topBorder);
		}

		// Content lines with side borders
		for (const line of childLines) {
			const visLen = visibleWidth(line);
			const padNeeded = Math.max(0, contentWidth - visLen);
			const paddedLine = line + " ".repeat(padNeeded);
			const borderedLine = this.styleBorder(leftPad + vChar + paddedLine + vChar + rightPad);
			result.push(borderedLine);
		}

		// Bottom border
		if (this.borderStyle !== "minimal") {
			const bottomBorder = this.styleBorder(
				leftPad +
					this.getBorderChar("bottomLeft") +
					hChar.repeat(contentWidth) +
					this.getBorderChar("bottomRight") +
					rightPad,
			);
			result.push(bottomBorder);
		}

		return result;
	}
}
