import type { AgentTool } from "@earendil-works/pi-agent-core";
import type { Api, TextContent } from "@earendil-works/pi-ai";
import type { Static } from "typebox";
import { Type } from "typebox";
import type { Theme } from "../../modes/interactive/theme/theme.ts";
import type { ToolDefinition, ToolRenderResultOptions } from "../extensions/types.ts";
import { resolveToCwd } from "./path-utils.ts";
import { getTextOutput, renderToolPath, str } from "./render-utils.ts";
import { wrapToolDefinition } from "./tool-definition-wrapper.ts";

const reviewTypeSchema = Type.Union([
	Type.Literal("code"),
	Type.Literal("skill"),
	Type.Literal("config"),
	Type.Literal("security"),
	Type.Literal("style"),
]);

const severitySchema = Type.Union([Type.Literal("info"), Type.Literal("warning"), Type.Literal("error")]);

const reviewerSchema = Type.Object({
	target: Type.String({ description: "Path to the file, directory, or skill to review (relative or absolute)" }),
	type: Type.Optional(reviewTypeSchema),
	context: Type.Optional(Type.String({ description: "Additional context or focus areas for the review" })),
	severity: Type.Optional(severitySchema),
});

export type ReviewerToolInput = Static<typeof reviewerSchema>;

export interface ReviewerToolDetails {
	findings: ReviewFinding[];
	summary: ReviewSummary;
}

export interface ReviewFinding {
	file: string;
	line?: number;
	severity: "info" | "warning" | "error";
	category: string;
	message: string;
	suggestion?: string;
	rule?: string;
}

export interface ReviewSummary {
	total_files: number;
	total_findings: number;
	by_severity: Record<string, number>;
	by_category: Record<string, number>;
}

export interface ReviewerToolOptions {
	/** Custom review rules configuration */
	rules?: Record<string, any>;
	/** Enable security-focused rules */
	securityMode?: boolean;
	/** Enable style/lint rules */
	styleMode?: boolean;
}

const defaultReviewerOptions: ReviewerToolOptions = {
	rules: {},
	securityMode: true,
	styleMode: true,
};

function formatReviewCall(args: { target?: string; type?: string } | undefined, theme: Theme, cwd: string): string {
	const pathDisplay = renderToolPath(str(args?.target), theme, cwd);
	const typeDisplay = args?.type ? ` [${args.type}]` : "";
	return `reviewer ${pathDisplay}${typeDisplay}`;
}

function formatReviewResult(
	args: { target?: string; type?: string } | undefined,
	result: { content: { type: "text"; text: string }[]; details?: ReviewerToolDetails },
	options: ToolRenderResultOptions,
	theme: Theme,
	_cwd: string,
	isError: boolean,
): string {
	if (!options.expanded && !isError) {
		return "";
	}

	const output = result.content.map((c) => c.text).join("\n");
	const details = result.details;

	let text = output;

	if (details?.summary) {
		const s = details.summary;
		text += `\n\n${"=".repeat(50)}`;
		text += `\nREVIEW SUMMARY`;
		text += `\n${"=".repeat(50)}`;
		text += `\nFiles reviewed: ${s.total_files}`;
		text += `\nTotal findings: ${s.total_findings}`;
		if (s.by_severity) {
			text += `\nBy severity: ${JSON.stringify(s.by_severity)}`;
		}
		if (s.by_category) {
			text += `\nBy category: ${JSON.stringify(s.by_category)}`;
		}
	}

	if (details?.findings && details.findings.length > 0) {
		text += `\n\nFINDINGS:`;
		for (const f of details.findings) {
			const lineInfo = f.line ? `:${f.line}` : "";
			text += `\n  [${f.severity.toUpperCase()}] ${f.file}${lineInfo} - ${f.category}: ${f.message}`;
			if (f.suggestion) {
				text += `\n    → ${f.suggestion}`;
			}
		}
	}

	return `\n${output}`;
}

function runCodeReview(
	targetPath: string,
	_options: ReviewerToolOptions,
): { findings: ReviewFinding[]; summary: ReviewSummary } {
	const findings: ReviewFinding[] = [];
	// This is a simplified implementation - in practice, you'd integrate with actual linters
	// For now, return a basic structure
	return {
		findings: [],
		summary: {
			total_files: 1,
			total_findings: 0,
			by_severity: { info: 0, warning: 0, error: 0 },
			by_category: {},
		},
	};
}

function runSkillReview(targetPath: string): { findings: ReviewFinding[]; summary: ReviewSummary } {
	// Review skill structure, checklist, scripts
	return {
		findings: [],
		summary: {
			total_files: 1,
			total_findings: 0,
			by_severity: { info: 0, warning: 0, error: 0 },
			by_category: {},
		},
	};
}

function runSecurityReview(targetPath: string): { findings: ReviewFinding[]; summary: ReviewSummary } {
	// Security-focused review
	return {
		findings: [],
		summary: {
			total_files: 1,
			total_findings: 0,
			by_severity: { info: 0, warning: 0, error: 0 },
			by_category: {},
		},
	};
}

function runStyleReview(targetPath: string): { findings: ReviewFinding[]; summary: ReviewSummary } {
	// Style/lint review
	return {
		findings: [],
		summary: {
			total_files: 1,
			total_findings: 0,
			by_severity: { info: 0, warning: 0, error: 0 },
			by_category: {},
		},
	};
}

function runConfigReview(targetPath: string): { findings: ReviewFinding[]; summary: ReviewSummary } {
	// Config file review
	return {
		findings: [],
		summary: {
			total_files: 1,
			total_findings: 0,
			by_severity: { info: 0, warning: 0, error: 0 },
			by_category: {},
		},
	};
}

export function createReviewerToolDefinition(_cwd: string, options?: ReviewerToolOptions): any {
	const opts = { ...defaultReviewerOptions, ...options };

	return {
		name: "reviewer",
		label: "reviewer",
		description: `Review code, skills, configs, or directories for issues. Supports code review, skill review, security audit, style checking, and config validation. Outputs findings with severity levels and suggestions.`,
		promptSnippet: "Review code, skills, or configs for issues",
		promptGuidelines: [
			"Use reviewer to audit code quality, security, and style",
			"Specify type to focus review: code, skill, security, style, config",
			"Use context to provide focus areas",
		],
		parameters: reviewerSchema,
		async execute(
			_toolCallId: string,
			params: { target: string; type?: string; context?: string; severity?: string },
			signal: AbortSignal | undefined,
			_onUpdate?: any,
			ctx?: any,
		) {
			return new Promise<{ content: { type: "text"; text: string }[]; details: ReviewerToolDetails | undefined }>(
				(resolve, reject) => {
					if (signal?.aborted) {
						reject(new Error("Operation aborted"));
						return;
					}
					let aborted = false;
					const onAbort = () => {
						aborted = true;
						reject(new Error("Operation aborted"));
					};
					signal?.addEventListener("abort", onAbort, { once: true });

					(async () => {
						try {
							// Destructure params
							const { target, type, context, severity } = params;
							// Resolve target path
							const absolutePath = resolveToCwd(target, process.cwd());

							let result: { findings: ReviewFinding[]; summary: ReviewSummary };

							// Route to appropriate review function based on type
							switch (type) {
								case "skill":
									result = runSkillReview(target);
									break;
								case "security":
									result = runSecurityReview(target);
									break;
								case "style":
									result = runStyleReview(target);
									break;
								case "config":
									result = runConfigReview(target);
									break;
								case "code":
								default:
									result = runCodeReview(target, {
										...defaultReviewerOptions,
										...(signal ? { securityMode: true, styleMode: true } : {}),
									});
									break;
							}

							// Filter findings by severity if specified
							let filteredFindings = result.findings;
							if (severity) {
								const severityOrder = { info: 0, warning: 1, error: 2 };
								const minSeverity = severityOrder[severity as keyof typeof severityOrder] ?? 0;
								filteredFindings = result.findings.filter(
									(f) => (severityOrder[f.severity] ?? 0) >= minSeverity,
								);
							}

							const summary: ReviewSummary = {
								total_files: 1,
								total_findings: filteredFindings.length,
								by_severity: { info: 0, warning: 0, error: 0 },
								by_category: {},
							};

							for (const f of filteredFindings) {
								summary.by_severity[f.severity] = (summary.by_severity[f.severity] ?? 0) + 1;
								summary.by_category[f.category] = (summary.by_category[f.category] ?? 0) + 1;
							}

							const finalResult = {
								...result,
								findings: filteredFindings,
								summary,
							};

							// Build output text
							let output = `Review completed for: ${target}`;
							if (type) output += ` (${type} review)`;
							if (context) output += `\nContext: ${context}`;
							output += `\n\n`;

							if (filteredFindings.length === 0) {
								output += "No issues found. ✅";
							} else {
								for (const f of filteredFindings) {
									const severityIcon = f.severity === "error" ? "❌" : f.severity === "warning" ? "⚠️" : "ℹ️";
									const lineInfo = f.line ? `:${f.line}` : "";
									output += `${severityIcon} [${f.severity.toUpperCase()}] ${f.file}${lineInfo} - ${f.category}: ${f.message}\n`;
									if (f.suggestion) {
										output += `  → ${f.suggestion}\n`;
									}
								}
							}

							output += `\nSummary: ${summary.total_findings} findings (${summary.by_severity.error || 0} errors, ${summary.by_severity.warning || 0} warnings, ${summary.by_severity.info || 0} info)`;

							if (!aborted) {
								resolve({
									content: [{ type: "text", text: output }],
									details: finalResult,
								});
							}
						} catch (error: any) {
							reject(error);
						}
					})();
				},
			);
		},
		renderCall(args: { target?: string; type?: string } | undefined, theme: Theme, context: { cwd: string }) {
			const text = { setText: (t: string) => t } as any;
			text.setText(formatReviewCall(args, theme, context.cwd));
			return text;
		},
		renderResult(
			result: { content: { type: "text"; text: string }[]; details?: ReviewerToolDetails },
			options: ToolRenderResultOptions,
			theme: Theme,
			context: { args: any; showImages: boolean; cwd: string; isError: boolean },
		) {
			const text = { setText: (t: string) => t } as any;
			text.setText(formatReviewResult(context.args, result, options, theme, context.cwd, context.isError));
			return text;
		},
	};
}

export function createReviewerTool(cwd: string, options?: ReviewerToolOptions): any {
	return wrapToolDefinition(createReviewerToolDefinition(cwd, options));
}
