import { openAICompletionsApi } from "../api/openai-completions.lazy.ts";
import { envApiKeyAuth } from "../auth/helpers.ts";
import { createProvider, type Provider } from "../models.ts";
import type { Model } from "../types.ts";
import { OPENROUTER_MODELS } from "./openrouter.models.ts";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/models";

interface OpenRouterModelResponse {
	id: string;
	name: string;
	supported_parameters?: string[];
	architecture?: { modality?: string[] };
	pricing?: {
		prompt?: string;
		completion?: string;
		input_cache_read?: string;
		input_cache_write?: string;
	};
	top_provider?: {
		context_length?: number;
		max_completion_tokens?: number;
	};
	context_length?: number;
}

interface OpenRouterModelsResponse {
	data?: OpenRouterModelResponse[];
}

function roundCost(value: number): number {
	return Number(value.toFixed(6));
}

async function fetchOpenRouterModels(apiKey: string): Promise<Model<"openai-completions">[]> {
	const response = await fetch(OPENROUTER_API_URL, {
		headers: {
			Authorization: `Bearer ${apiKey}`,
		},
	});

	if (!response.ok) {
		throw new Error(`OpenRouter models fetch failed: ${response.status} ${response.statusText}`);
	}

	const data = (await response.json()) as OpenRouterModelsResponse;
	const models: Model<"openai-completions">[] = [];

	for (const model of data.data ?? []) {
		// Only include models that support tools
		if (!model.supported_parameters?.includes("tools")) continue;

		// Parse input modalities
		const input: ("text" | "image")[] = ["text"];
		if (model.architecture?.modality?.includes("image")) {
			input.push("image");
		}

		// Convert pricing from $/token to $/million tokens
		const inputCost = roundCost(parseFloat(model.pricing?.prompt || "0") * 1_000_000);
		const outputCost = roundCost(parseFloat(model.pricing?.completion || "0") * 1_000_000);
		const cacheReadCost = roundCost(parseFloat(model.pricing?.input_cache_read || "0") * 1_000_000);
		const cacheWriteCost = roundCost(parseFloat(model.pricing?.input_cache_write || "0") * 1_000_000);

		const contextWindow = model.top_provider?.context_length || model.context_length || 4096;
		const maxTokens = model.top_provider?.max_completion_tokens || 4096;

		models.push({
			id: model.id,
			name: model.name,
			api: "openai-completions",
			baseUrl: "https://openrouter.ai/api/v1",
			provider: "openrouter",
			reasoning: model.supported_parameters?.includes("reasoning") || false,
			input,
			cost: {
				input: inputCost,
				output: outputCost,
				cacheRead: cacheReadCost,
				cacheWrite: cacheWriteCost,
			},
			contextWindow,
			maxTokens,
		});
	}

	return models;
}

export async function refreshOpenRouterModels(): Promise<Model<"openai-completions">[]> {
	const apiKey = process.env.OPENROUTER_API_KEY;
	if (!apiKey) {
		throw new Error("OpenRouter API key not configured (OPENROUTER_API_KEY)");
	}
	return fetchOpenRouterModels(apiKey);
}

export function openrouterProvider(): Provider<"openai-completions"> {
	return createProvider({
		id: "openrouter",
		name: "OpenRouter",
		baseUrl: "https://openrouter.ai/api/v1",
		auth: { apiKey: envApiKeyAuth("OpenRouter API key", ["OPENROUTER_API_KEY"]) },
		models: Object.values(OPENROUTER_MODELS),
		refreshModels: refreshOpenRouterModels,
		api: openAICompletionsApi(),
	});
}
