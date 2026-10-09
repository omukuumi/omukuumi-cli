import type { Component } from "@earendil-works/pi-tui";
import { theme } from "../theme/theme.ts";

const VERSION: string = process.env.PI_VERSION || "0.80.6";

/**
 * BrandPanel - Left column (20%):
 * Omukuumi ASCII branding with wave pattern, name, version, git branch.
 */
export class BrandPanel implements Component {
	private gitBranch: string | undefined;

	constructor(gitBranch?: string, _sessionName?: string) {
		this.gitBranch = gitBranch;
	}

	setGitBranch(branch: string | undefined): void {
		this.gitBranch = branch;
	}
	invalidate(): void {}

	render(width: number): string[] {
		const w = Math.max(4, width);
		let wave = "";
		for (let i = 0; i < w; i++) wave += i % 2 === 0 ? "/" : "\\";

		return [
			theme.fg("accent", wave),
			theme.bold(theme.fg("accent", "O M U K U U M I")),
			theme.fg("dim", `v${VERSION}`),
			"",
			this.gitBranch ? `# ${this.gitBranch}` : undefined,
			"",
		].filter((l) => l !== undefined) as string[];
	}
}
