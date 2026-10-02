import path from "node:path";
import { type Component, truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import type { AgentSession } from "../../../core/agent-session.ts";
import { areExperimentalFeaturesEnabled } from "../../../core/experimental.ts";
import type { ReadonlyFooterDataProvider } from "../../../core/footer-data-provider.ts";
import { theme } from "../theme/theme.ts";
import { formatTokens } from "./footer.ts";

const USD_TO_UGX_RATE = 3800;

function formatUgxCost(usdCost: number): string {
	const ugxCost = usdCost * USD_TO_UGX_RATE;
	if (usdCost > 0 && ugxCost < 1) return "<1 UGX";
	return `${Math.round(ugxCost + 1e-9).toLocaleString()} UGX`;
}

/**
 * SidebarComponent - Displays session info in the right sidebar
 * Shows: model, context usage, token stats, cost, weather, git branch, extensions
 */
export class SidebarComponent implements Component {
	private session: AgentSession;
	private footerData: ReadonlyFooterDataProvider;
	private width: number;

	constructor(session: AgentSession, footerData: ReadonlyFooterDataProvider, width: number = 35) {
		this.session = session;
		this.footerData = footerData;
		this.width = width;
	}

	setWidth(width: number): void {
		this.width = width;
	}

	invalidate(): void {
		// No internal cache to invalidate
	}

	render(width: number): string[] {
		this.width = width;
		const state = this.session.state;
		const lines: string[] = [];

		// Title
		lines.push(theme.fg("accent", " Omukuumi"));
		lines.push(theme.fg("muted", "─".repeat(this.width - 2)));
		lines.push("");

		// Working directory
		let pwd = this.session.sessionManager.getCwd();
		const home = process.env.HOME || process.env.USERPROFILE;
		if (home) {
			const relative = path.relative(home, pwd);
			if (!relative.startsWith("..")) {
				pwd = relative === "" ? "~" : `~/${relative}`;
			}
		}
		lines.push(theme.fg("text", truncateToWidth(`📁 ${pwd}`, this.width - 2, "...")));
		lines.push("");

		// Git branch
		const branch = this.footerData.getGitBranch();
		if (branch) {
			lines.push(theme.fg("text", truncateToWidth(`🌿 ${branch}`, this.width - 2, "...")));
			lines.push("");
		}

		// Session name
		const sessionName = this.session.sessionManager.getSessionName();
		if (sessionName) {
			lines.push(theme.fg("text", truncateToWidth(`📝 ${sessionName}`, this.width - 2, "...")));
			lines.push("");
		}

		// Model info
		const modelName = state.model?.id || "no-model";
		let modelDisplay = modelName;
		if (state.model?.reasoning) {
			const thinkingLevel = state.thinkingLevel || "off";
			if (thinkingLevel !== "off") {
				modelDisplay = `${modelName} (${thinkingLevel})`;
			}
		}
		lines.push(theme.fg("accent", "🤖 Model"));
		lines.push(theme.fg("text", truncateToWidth(modelDisplay, this.width - 2, "...")));
		lines.push("");

		// Context usage
		const contextUsage = this.session.getContextUsage();
		const contextWindow = contextUsage?.contextWindow ?? state.model?.contextWindow ?? 0;
		const contextPercentValue = contextUsage?.percent ?? 0;
		const contextPercent = contextUsage?.percent !== null ? contextPercentValue.toFixed(1) : "?";

		let contextColor = "text";
		if (contextPercentValue > 90) contextColor = "error";
		else if (contextPercentValue > 70) contextColor = "warning";

		const autoIndicator = this.session.autoCompactionEnabled ? " (auto)" : "";
		const contextDisplay =
			contextPercent === "?"
				? `?/${formatTokens(contextWindow)}${autoIndicator}`
				: `${contextPercent}%/${formatTokens(contextWindow)}${autoIndicator}`;

		lines.push(theme.fg("accent", "📊 Context"));
		lines.push(theme.fg(contextColor as any, truncateToWidth(contextDisplay, this.width - 2, "...")));
		lines.push("");

		// Token stats
		let totalInput = 0;
		let totalOutput = 0;
		let totalCacheRead = 0;
		let totalCacheWrite = 0;
		let totalCost = 0;
		let latestCacheHitRate: number | undefined;

		for (const entry of this.session.sessionManager.getEntries()) {
			if (entry.type === "message" && entry.message.role === "assistant") {
				totalInput += entry.message.usage.input;
				totalOutput += entry.message.usage.output;
				totalCacheRead += entry.message.usage.cacheRead;
				totalCacheWrite += entry.message.usage.cacheWrite;
				totalCost += entry.message.usage.cost.total;

				const latestPromptTokens =
					entry.message.usage.input + entry.message.usage.cacheRead + entry.message.usage.cacheWrite;
				latestCacheHitRate =
					latestPromptTokens > 0 ? (entry.message.usage.cacheRead / latestPromptTokens) * 100 : undefined;
			}
		}

		lines.push(theme.fg("accent", "📈 Tokens"));
		if (totalInput) lines.push(theme.fg("text", `  ↑ ${formatTokens(totalInput)}`));
		if (totalOutput) lines.push(theme.fg("text", `  ↓ ${formatTokens(totalOutput)}`));
		if (totalCacheRead) lines.push(theme.fg("text", `  R ${formatTokens(totalCacheRead)}`));
		if (totalCacheWrite) lines.push(theme.fg("text", `  W ${formatTokens(totalCacheWrite)}`));
		if ((totalCacheRead > 0 || totalCacheWrite > 0) && latestCacheHitRate !== undefined) {
			lines.push(theme.fg("text", `  CH ${latestCacheHitRate.toFixed(1)}%`));
		}
		lines.push("");

		// Cost
		const usingSubscription = state.model ? this.session.modelRegistry.isUsingOAuth(state.model) : false;
		const costStr = `${formatUgxCost(totalCost)}${usingSubscription ? " (sub)" : ""}`;
		lines.push(theme.fg("accent", "💰 Cost"));
		lines.push(theme.fg("text", truncateToWidth(costStr, this.width - 2, "...")));
		lines.push("");

		// Weather
		const kampalaWeather = this.footerData.getKampalaWeather();
		if (kampalaWeather) {
			lines.push(theme.fg("accent", "🌤️ Weather"));
			lines.push(theme.fg("text", truncateToWidth(kampalaWeather, this.width - 2, "...")));
			lines.push("");
		}

		// Extensions
		const extensionStatuses = this.footerData.getExtensionStatuses();
		if (extensionStatuses.size > 0) {
			lines.push(theme.fg("accent", "🔌 Extensions"));
			const sortedStatuses = Array.from(extensionStatuses.entries())
				.sort(([a], [b]) => a.localeCompare(b))
				.map(([, text]) =>
					text
						.replace(/[\r\n\t]/g, " ")
						.replace(/ +/g, " ")
						.trim(),
				);
			for (const status of sortedStatuses) {
				lines.push(theme.fg("muted", truncateToWidth(`  ${status}`, this.width - 2, "...")));
			}
			lines.push("");
		}

		// Experimental features
		if (areExperimentalFeaturesEnabled()) {
			lines.push(theme.fg("warning", "⚡ Experimental"));
			lines.push("");
		}

		// Keybindings hint
		lines.push(theme.fg("muted", "─".repeat(this.width - 2)));
		lines.push(theme.fg("dim", " PgUp/PgDn: Scroll"));
		lines.push(theme.fg("dim", " Home/End: Top/Bottom"));

		return lines;
	}
}
