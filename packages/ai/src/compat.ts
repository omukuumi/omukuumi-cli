/**
 * Temporary compatibility entrypoint preserving the old global pi-ai API
 * surface: api-dispatch `stream()`/`complete()` with env API key injection,
 * the api-registry, generated catalog reads (`getModel`/`getModels`/
 * `getProviders`), per-API lazy stream wrappers, and image generation.
 *
 * Existing apps switch imports from "@earendil-works/pi-ai" to
 * "@earendil-works/pi-ai/compat" unchanged; new code uses `createModels()`
 * and the provider factories. This module is deleted with the coding-agent
 * ModelManager migration.
 */

export * from "./api/anthropic-messages.lazy.ts";
export * from "./api/azure-openai-responses.lazy.ts";
export * from "./api/bedrock-converse-stream.lazy.ts";
export * from "./api/google-generative-ai.lazy.ts";
export * from "./api/google-vertex.lazy.ts";
export * from "./api/mistral-conversations.lazy.ts";
export * from "./api/openai-codex-responses.lazy.ts";
export * from "./api/openai-completions.lazy.ts";
export * from "./api/openai-responses.lazy.ts";
export * from "./env-api-keys.ts";
export * from "./image-models.ts";
export * from "./images.ts";
export * from "./images-api-registry.ts";
export * from "./index.ts";
export * from "./legacy-api-aliases.ts";
export * from "./providers/images/register-builtins.ts";

import { anthropicMessagesApi } from "./api/anthropic-messages.lazy.ts";
import { azureOpenAIResponsesApi } from "./api/azure-openai-responses.lazy.ts";
import { bedrockConverseStreamApi } from "./api/bedrock-converse-stream.lazy.ts";
import { googleGenerativeAIApi } from "./api/google-generative-ai.lazy.ts";
import { googleVertexApi } from "./api/google-vertex.lazy.ts";
import { lazyStream } from "./api/lazy.ts";
import { mistralConversationsApi } from "./api/mistral-conversations.lazy.ts";
import { openAICodexResponsesApi } from "./api/openai-codex-responses.lazy.ts";
import { openAICompletionsApi } from "./api/openai-completions.lazy.ts";
import { openAIResponsesApi } from "./api/openai-responses.lazy.ts";
import { getEnvApiKey } from "./env-api-keys.ts";
import { builtinModels, getBuiltinModel, getBuiltinModels, getBuiltinProviders } from "./providers/all.ts";
import { createFauxCore, type FauxProviderRegistration, type RegisterFauxProviderOptions } from "./providers/faux.ts";
import type {
	Api,
	ApiStreamOptions,
	AssistantMessage,
	AssistantMessageEventStream,
	Context,
	Model,
	ProviderStreamOptions,
	ProviderStreams,
	SimpleStreamOptions,
	StreamFunction,
	StreamOptions,
} from "./types.ts";

/** @deprecated Static catalog read. Use `getBuiltinModel` from "@earendil-works/pi-ai/providers/all" or `Models.getModel()`. */
export const getModel = getBuiltinModel;

/** @deprecated Static catalog read. Use `getBuiltinModels` from "@earendil-works/pi-ai/providers/all" or `Models.getModels()`. */
export const getModels = getBuiltinModels;

/** @deprecated Static catalog read. Use `getBuiltinProviders` from "@earendil-works/pi-ai/providers/all" or `Models.getProviders()`. */
export const getProviders = getBuiltinProviders;

export type ApiStreamFunction = (
	model: Model<Api>,
	context: Context,
	options?: StreamOptions,
) => AssistantMessageEventStream;

export type ApiStreamSimpleFunction = (
	model: Model<Api>,
	context: Context,
	options?: SimpleStreamOptions,
) => AssistantMessageEventStream;

export interface ApiProvider<TApi extends Api = Api, TOptions extends StreamOptions = StreamOptions> {
	api: TApi;
	stream: StreamFunction<TApi, TOptions>;
	streamSimple: StreamFunction<TApi, SimpleStreamOptions>;
}

interface ApiProviderInternal {
	api: Api;
	stream: ApiStreamFunction;
	streamSimple: ApiStreamSimpleFunction;
}

type RegisteredApiProvider = {
	provider: ApiProviderInternal;
	sourceId?: string;
};

const apiProviderRegistry = new Map<string, RegisteredApiProvider>();

function wrapStream<TApi extends Api, TOptions extends StreamOptions>(
	api: TApi,
	stream: StreamFunction<TApi, TOptions>,
): ApiStreamFunction {
	return (model, context, options) => {
		if (model.api !== api) {
			throw new Error(`Mismatched api: ${model.api} expected ${api}`);
		}
		return stream(model as Model<TApi>, context, options as TOptions);
	};
}

function wrapStreamSimple<TApi extends Api>(
	api: TApi,
	streamSimple: StreamFunction<TApi, SimpleStreamOptions>,
): ApiStreamSimpleFunction {
	return (model, context, options) => {
		if (model.api !== api) {
			throw new Error(`Mismatched api: ${model.api} expected ${api}`);
		}
		return streamSimple(model as Model<TApi>, context, options);
	};
}

export function registerApiProvider<TApi extends Api, TOptions extends StreamOptions>(
	provider: ApiProvider<TApi, TOptions>,
	sourceId?: string,
): void {
	apiProviderRegistry.set(provider.api, {
		provider: {
			api: provider.api,
			stream: wrapStream(provider.api, provider.stream),
			streamSimple: wrapStreamSimple(provider.api, provider.streamSimple),
		},
		sourceId,
	});
}

export function getApiProvider(api: Api): ApiProviderInternal | undefined {
	return apiProviderRegistry.get(api)?.provider;
}

export function getApiProviders(): ApiProviderInternal[] {
	return Array.from(apiProviderRegistry.values(), (entry) => entry.provider);
}

export function unregisterApiProviders(sourceId: string): void {
	for (const [api, entry] of apiProviderRegistry.entries()) {
		if (entry.sourceId === sourceId) {
			apiProviderRegistry.delete(api);
		}
	}
}

function clearApiProviders(): void {
	apiProviderRegistry.clear();
}

export function registerFauxProvider(options: RegisterFauxProviderOptions = {}): FauxProviderRegistration {
	const core = createFauxCore(options);
	const sourceId = `faux-provider-${Math.random().toString(36).slice(2, 10)}`;
	registerApiProvider({ api: core.api, stream: core.stream, streamSimple: core.streamSimple }, sourceId);
	return {
		api: core.api,
		models: core.models,
		getModel: core.getModel,
		state: core.state,
		setResponses: core.setResponses,
		appendResponses: core.appendResponses,
		getPendingResponseCount: core.getPendingResponseCount,
		unregister() {
			unregisterApiProviders(sourceId);
		},
	};
}

const BUILTIN_APIS: [Api, ProviderStreams][] = [
	["anthropic-messages", anthropicMessagesApi()],
	["openai-completions", openAICompletionsApi()],
	["openai-responses", openAIResponsesApi()],
	["openai-codex-responses", openAICodexResponsesApi()],
	["azure-openai-responses", azureOpenAIResponsesApi()],
	["google-generative-ai", googleGenerativeAIApi()],
	["google-vertex", googleVertexApi()],
	["mistral-conversations", mistralConversationsApi()],
	["bedrock-converse-stream", bedrockConverseStreamApi()],
];

const builtinApiProviderInstances = new Map<Api, ReturnType<typeof getApiProvider>>();

/**
 * Registers the builtin API implementations into the api-registry without
 * clobbering existing entries: compat may load after a test or extension has
 * already registered an override for a builtin api id.
 */
export function registerBuiltInApiProviders(): void {
	for (const [api, streams] of BUILTIN_APIS) {
		if (!getApiProvider(api)) {
			registerApiProvider({ api, stream: streams.stream, streamSimple: streams.streamSimple });
		}
		builtinApiProviderInstances.set(api, getApiProvider(api));
	}
}

export function resetApiProviders(): void {
	clearApiProviders();
	builtinApiProviderInstances.clear();
	registerBuiltInApiProviders();
}

registerBuiltInApiProviders();

const compatModels = builtinModels();

function hasExplicitApiKey(apiKey: string | undefined): apiKey is string {
	return typeof apiKey === "string" && apiKey.trim().length > 0;
}

function withEnvApiKey<TOptions extends StreamOptions>(
	model: Model<Api>,
	options: TOptions | undefined,
): TOptions | undefined {
	if (hasExplicitApiKey(options?.apiKey)) return options;
	const apiKey = getEnvApiKey(model.provider, options?.env);
	if (!apiKey) return options;
	return { ...options, apiKey } as TOptions;
}

function shouldUseBuiltinModels(model: Model<Api>): boolean {
	const builtin = compatModels.getModel(model.provider, model.id);
	return builtin?.api === model.api && getApiProvider(model.api) === builtinApiProviderInstances.get(model.api);
}

// Cloudflare auth resolution for compat module

function getProviderEnvValue(name: string, env?: Record<string, string | undefined>): string | undefined {
	if (!env) return undefined;
	return env[name];
}

async function resolveValue(name: string, env?: Record<string, string | undefined>): Promise<string | undefined> {
	if (typeof process !== "undefined" && process.env?.[name]) {
		return process.env[name];
	}
	return getProviderEnvValue(name, env);
}

function resolveCloudflareBaseUrl(
	model: { baseUrl: string; provider: string },
	accountId: string,
	gatewayId: string | undefined,
): string {
	return model.baseUrl
		.replaceAll(`{CLOUDFLARE_ACCOUNT_ID}`, accountId)
		.replaceAll(`{CLOUDFLARE_GATEWAY_ID}`, gatewayId ?? "");
}

async function resolveCloudflareEnv(
	kind: "workers-ai" | "ai-gateway",
	model: { baseUrl: string; provider: string },
	env?: Record<string, string | undefined>,
): Promise<{ apiKey: string; env: Record<string, string>; baseUrl: string; source: string } | undefined> {
	const apiKey = await resolveValue("CLOUDFLARE_API_KEY", env);
	const accountId = await resolveValue("CLOUDFLARE_ACCOUNT_ID", env);
	const gatewayId = kind === "ai-gateway" ? await resolveValue("CLOUDFLARE_GATEWAY_ID", env) : undefined;

	if (!apiKey || !accountId || (kind === "ai-gateway" && !gatewayId)) return undefined;

	return {
		apiKey,
		env: {
			CLOUDFLARE_ACCOUNT_ID: accountId,
			...(gatewayId ? { CLOUDFLARE_GATEWAY_ID: gatewayId } : {}),
		},
		baseUrl: resolveCloudflareBaseUrl(model, accountId, gatewayId),
		source: "env",
	};
}

async function resolveCloudflareAuth(
	model: { baseUrl: string; provider: string },
	env?: Record<string, string | undefined>,
): Promise<{ baseUrl: string; headers?: Record<string, string | null>; env?: Record<string, string> } | undefined> {
	const isWorkersAI = model.provider === "cloudflare-workers-ai" || model.baseUrl.includes("api.cloudflare.com");
	const isAiGateway =
		model.provider === "cloudflare-ai-gateway" || model.baseUrl.includes("gateway.ai.cloudflare.com");

	if (!isWorkersAI && !isAiGateway) return undefined;

	const kind: "workers-ai" | "ai-gateway" =
		model.provider === "cloudflare-workers-ai" || model.baseUrl.includes("api.cloudflare.com")
			? "workers-ai"
			: "ai-gateway";
	const resolved = await resolveCloudflareEnv(kind, model, env);

	if (!resolved) return undefined;

	const headers: Record<string, string | null> = {};
	if (resolved.apiKey) {
		if (model.provider === "cloudflare-ai-gateway" || model.baseUrl.includes("gateway.ai.cloudflare.com")) {
			headers["cf-aig-authorization"] = `Bearer ${resolved.apiKey}`;
			headers.Authorization = null;
			headers["x-api-key"] = null;
		} else {
			headers.Authorization = `Bearer ${resolved.apiKey}`;
		}
	}

	return {
		baseUrl: resolved.baseUrl,
		headers: Object.keys(headers).length > 0 ? headers : undefined,
		env: resolved.env,
	};
}

async function resolveCloudflareAuthForModel(
	model: Model<Api>,
	options?: SimpleStreamOptions | StreamOptions,
): Promise<{ model: Model<Api>; options: typeof options } | undefined> {
	const env = options?.env;
	const resolved = await resolveCloudflareAuth(model, env);
	if (!resolved) return undefined;

	const newModel = { ...model, baseUrl: resolved.baseUrl };
	const newOptions: typeof options = { ...options };
	if (resolved.headers) {
		newOptions.headers = { ...resolved.headers, ...options?.headers };
	}
	newOptions.env = { ...resolved.env, ...options?.env };
	// Ensure sessionId is preserved for session affinity headers
	if (options?.sessionId) {
		newOptions.sessionId = options.sessionId;
	}
	return { model: newModel, options: newOptions };
}

function resolveApiProvider(api: Api) {
	const provider = getApiProvider(api);
	if (!provider) {
		throw new Error(`No API provider registered for api: ${api}`);
	}
	return provider;
}

export function stream<TApi extends Api>(
	model: Model<TApi>,
	context: Context,
	options?: ProviderStreamOptions,
): AssistantMessageEventStream {
	if (shouldUseBuiltinModels(model)) {
		return compatModels.stream(model, context, options as ApiStreamOptions<TApi> | undefined);
	}
	const provider = resolveApiProvider(model.api);
	return lazyStream(model, async () => {
		const resolved = await resolveCloudflareAuthForModel(model, options);
		const finalModel = resolved?.model ?? model;
		const finalOptions = resolved?.options ?? withEnvApiKey(model, options);
		return provider.stream(finalModel, context, finalOptions as StreamOptions);
	});
}

export async function complete<TApi extends Api>(
	model: Model<TApi>,
	context: Context,
	options?: ProviderStreamOptions,
): Promise<AssistantMessage> {
	const s = stream(model, context, options);
	return s.result();
}

export function streamSimple<TApi extends Api>(
	model: Model<TApi>,
	context: Context,
	options?: SimpleStreamOptions,
): AssistantMessageEventStream {
	if (shouldUseBuiltinModels(model)) {
		return compatModels.streamSimple(model, context, options);
	}
	const provider = resolveApiProvider(model.api);
	return lazyStream(model, async () => {
		const resolved = await resolveCloudflareAuthForModel(model, options);
		const finalModel = resolved?.model ?? model;
		const finalOptions = resolved?.options ?? withEnvApiKey(model, options);
		return provider.streamSimple(finalModel, context, finalOptions);
	});
}

export async function completeSimple<TApi extends Api>(
	model: Model<TApi>,
	context: Context,
	options?: SimpleStreamOptions,
): Promise<AssistantMessage> {
	const s = streamSimple(model, context, options);
	return s.result();
}
