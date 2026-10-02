import type { AgentSessionServices } from "./agent-session-services.ts";
import type { AuthStorage } from "./auth-storage.ts";
import { refreshUpskillsafricaModels } from "./upskillsafrica-model-refresh.ts";

const ACCOUNT_PROVIDER_ID = "upskillsafrica-rask-d-technology";
const MODEL_PROVIDER_ID = "upskillsafrica";
const DEFAULT_BACKEND_URL = "https://upskillsafrica-ai-backend.boyg87059.workers.dev";

export interface UpskillsafricaBackendModel {
	id: string;
	name: string;
	source?: string;
	priceTier?: string;
	capabilities: string[];
	contextWindow?: number;
	maxTokens?: number;
	requiresOrgCode: boolean;
	status?: string;
}

export interface UpskillsafricaPlan {
	id: string;
	name: string;
	amountRwf: number;
	durationMs: number;
	gpt5DailyMsLimit: number;
	description: string;
}

export interface UpskillsafricaEntitlement {
	receiptRef: string;
	planId: string;
	amountRwf: number;
	status: string;
	startsAt: string;
	expiresAt: string;
	gpt5DailyMsLimit: number;
}

export interface UpskillsafricaBootstrap {
	authenticated: boolean;
	email?: string;
	organisationCodeConfigured: boolean;
	organisationCodeExpiresAt?: string | null;
	organisationLabel?: string;
	entitlements: UpskillsafricaEntitlement[];
	plans: UpskillsafricaPlan[];
	models: UpskillsafricaBackendModel[];
}

interface JsonObject {
	[key: string]: unknown;
}

function backendUrl(): string {
	return (process.env.UPSKILLSAFRICA_BACKEND_URL || DEFAULT_BACKEND_URL).replace(/\/$/, "");
}

function readString(value: unknown): string | undefined {
	return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function readNumber(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function readBoolean(value: unknown, fallback = false): boolean {
	return typeof value === "boolean" ? value : fallback;
}

function readObject(value: unknown): JsonObject {
	return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as JsonObject) : {};
}

function readModels(value: unknown): UpskillsafricaBackendModel[] {
	if (!Array.isArray(value)) return [];
	return value.flatMap((item): UpskillsafricaBackendModel[] => {
		const model = readObject(item);
		const id = readString(model.id);
		if (!id) return [];
		const capabilities = Array.isArray(model.capabilities)
			? model.capabilities.filter((capability): capability is string => typeof capability === "string")
			: [];
		return [
			{
				id,
				name: readString(model.name) || id,
				source: readString(model.source),
				priceTier: readString(model.priceTier),
				capabilities,
				contextWindow: readNumber(model.contextWindow),
				maxTokens: readNumber(model.maxTokens),
				requiresOrgCode: readBoolean(model.requiresOrgCode),
				status: readString(model.status),
			},
		];
	});
}

function readPlans(value: unknown): UpskillsafricaPlan[] {
	if (!Array.isArray(value)) return [];
	return value.flatMap((item): UpskillsafricaPlan[] => {
		const plan = readObject(item);
		const id = readString(plan.id);
		const name = readString(plan.name);
		const amountRwf = readNumber(plan.amountRwf);
		const durationMs = readNumber(plan.durationMs);
		const gpt5DailyMsLimit = readNumber(plan.gpt5DailyMsLimit);
		const description = readString(plan.description);
		if (
			!id ||
			!name ||
			amountRwf === undefined ||
			durationMs === undefined ||
			gpt5DailyMsLimit === undefined ||
			!description
		)
			return [];
		return [{ id, name, amountRwf, durationMs, gpt5DailyMsLimit, description }];
	});
}

function readEntitlements(value: unknown): UpskillsafricaEntitlement[] {
	if (!Array.isArray(value)) return [];
	return value.flatMap((item): UpskillsafricaEntitlement[] => {
		const entitlement = readObject(item);
		const receiptRef = readString(entitlement.receiptRef);
		const planId = readString(entitlement.planId);
		const amountRwf = readNumber(entitlement.amountRwf);
		const status = readString(entitlement.status);
		const startsAt = readString(entitlement.startsAt);
		const expiresAt = readString(entitlement.expiresAt);
		const gpt5DailyMsLimit = readNumber(entitlement.gpt5DailyMsLimit);
		if (
			!receiptRef ||
			!planId ||
			amountRwf === undefined ||
			!status ||
			!startsAt ||
			!expiresAt ||
			gpt5DailyMsLimit === undefined
		)
			return [];
		return [{ receiptRef, planId, amountRwf, status, startsAt, expiresAt, gpt5DailyMsLimit }];
	});
}

async function request(path: string, init?: RequestInit): Promise<JsonObject> {
	const response = await fetch(`${backendUrl()}${path}`, init);
	const body = readObject(await response.json().catch(() => ({})));
	if (!response.ok)
		throw new Error(readString(body.message) || `Upskillsafrica request failed with HTTP ${response.status}`);
	return body;
}

function getStoredToken(authStorage: AuthStorage): string | undefined {
	const modelCredential = authStorage.get(MODEL_PROVIDER_ID);
	if (modelCredential?.type === "api_key") return modelCredential.key;
	const accountCredential = authStorage.get(ACCOUNT_PROVIDER_ID);
	return accountCredential?.type === "api_key" ? accountCredential.key : undefined;
}

function getStoredEnvironment(authStorage: AuthStorage): Record<string, string> {
	const accountCredential = authStorage.get(ACCOUNT_PROVIDER_ID);
	const modelCredential = authStorage.get(MODEL_PROVIDER_ID);
	return {
		...(accountCredential?.type === "api_key" ? accountCredential.env : {}),
		...(modelCredential?.type === "api_key" ? modelCredential.env : {}),
	};
}

function saveCredentials(authStorage: AuthStorage, token: string, environment: Record<string, string>): void {
	for (const provider of [ACCOUNT_PROVIDER_ID, MODEL_PROVIDER_ID]) {
		authStorage.set(provider, { type: "api_key", key: token, env: environment });
	}
}

function authHeaders(token: string): Record<string, string> {
	return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

async function fetchPublicModels(): Promise<UpskillsafricaBackendModel[]> {
	const body = await request("/models", { headers: { accept: "application/json" } });
	return readModels(body.models);
}

export async function getUpskillsafricaBootstrap(authStorage: AuthStorage): Promise<UpskillsafricaBootstrap> {
	const token = getStoredToken(authStorage);
	const environment = getStoredEnvironment(authStorage);
	if (!token) {
		return {
			authenticated: false,
			organisationCodeConfigured: Boolean(environment.UPSKILLSAFRICA_ORG_CODE),
			entitlements: [],
			plans: readPlans((await request("/plans")).plans),
			models: await fetchPublicModels(),
		};
	}
	const body = await request("/auth/me", { headers: { Authorization: `Bearer ${token}` } });
	const user = readObject(body.user);
	return {
		authenticated: true,
		email: readString(user.email),
		organisationCodeConfigured: Boolean(environment.UPSKILLSAFRICA_ORG_CODE),
		organisationCodeExpiresAt: environment.UPSKILLSAFRICA_ORG_CODE_EXPIRES_AT || null,
		organisationLabel: environment.UPSKILLSAFRICA_ORG_LABEL,
		entitlements: readEntitlements(body.entitlements),
		plans: readPlans(body.plans),
		models: readModels(body.models),
	};
}

export async function authenticateUpskillsafrica(
	authStorage: AuthStorage,
	mode: "login" | "register",
	email: string,
	password: string,
	confirmPassword?: string,
): Promise<UpskillsafricaBootstrap> {
	const payload: JsonObject = { email, password };
	if (mode === "register") payload.confirmPassword = confirmPassword;
	const body = await request(`/auth/${mode}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});
	const token = readString(body.token);
	if (!token) throw new Error("Backend did not return a login session.");
	const environment = { ...getStoredEnvironment(authStorage), UPSKILLSAFRICA_BACKEND_URL: backendUrl() };
	saveCredentials(authStorage, token, environment);
	return getUpskillsafricaBootstrap(authStorage);
}

export async function verifyUpskillsafricaOrganisationCode(
	authStorage: AuthStorage,
	organisationCode: string,
): Promise<UpskillsafricaBootstrap> {
	const token = getStoredToken(authStorage);
	if (!token) throw new Error("Login first before adding an organisation code.");
	const body = await request("/auth/org-code/verify", {
		method: "POST",
		headers: authHeaders(token),
		body: JSON.stringify({ organisationCode }),
	});
	const environment = {
		...getStoredEnvironment(authStorage),
		UPSKILLSAFRICA_BACKEND_URL: backendUrl(),
		UPSKILLSAFRICA_ORG_CODE: organisationCode,
		...(readString(body.label) ? { UPSKILLSAFRICA_ORG_LABEL: readString(body.label) } : {}),
		...(readString(body.expiresAt) ? { UPSKILLSAFRICA_ORG_CODE_EXPIRES_AT: readString(body.expiresAt) } : {}),
	};
	saveCredentials(authStorage, token, environment);
	return getUpskillsafricaBootstrap(authStorage);
}

export async function refreshUpskillsafricaRuntime(services: AgentSessionServices): Promise<UpskillsafricaBootstrap> {
	await refreshUpskillsafricaModels({
		agentDir: services.agentDir,
		modelsJsonPath: `${services.agentDir}/models.json`,
		force: true,
	});
	services.modelRegistry.refresh();
	return getUpskillsafricaBootstrap(services.authStorage);
}
