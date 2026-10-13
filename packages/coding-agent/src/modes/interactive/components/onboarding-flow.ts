import { Container, getKeybindings, Input, Spacer, Text, type TUI } from "@earendil-works/pi-tui";
import { theme } from "../theme/theme.ts";
import { DynamicBorder } from "./dynamic-border.ts";
import { keyHint, rawKeyHint } from "./keybinding-hints.ts";

export interface OnboardingData {
	accountType: "individual" | "organization";
	organizationName?: string;
	contactEmail?: string;
	apiKeys: Record<string, string>;
	defaultProvider: string;
	defaultModel: string;
	thinkingLevel: "off" | "minimal" | "low" | "medium" | "high";
	shareAnalytics: boolean;
	theme: "dark" | "light";
}

export interface OnboardingOptions {
	detectedTheme: "dark" | "light";
	onSubmit: (data: OnboardingData) => void;
	onCancel: () => void;
}

const THEME_OPTIONS = [
	{ value: "dark" as const, label: "Dark (Omukuumi Deep)" },
	{ value: "light" as const, label: "Light (Omukuumi Bright)" },
];

const ACCOUNT_TYPES = [
	{ value: "individual" as const, label: "Individual Developer" },
	{ value: "organization" as const, label: "Organization/Team" },
];

const PROVIDERS = [
	{ id: "anthropic", name: "Anthropic (Claude)", env: "ANTHROPIC_API_KEY", supportsOAuth: true },
	{ id: "openai", name: "OpenAI (GPT)", env: "OPENAI_API_KEY", supportsOAuth: false },
	{ id: "google", name: "Google (Gemini)", env: "GEMINI_API_KEY", supportsOAuth: false },
	{ id: "openrouter", name: "OpenRouter", env: "OPENROUTER_API_KEY", supportsOAuth: false },
	{ id: "groq", name: "Groq", env: "GROQ_API_KEY", supportsOAuth: false },
	{ id: "cerebras", name: "Cerebras", env: "CEREBRAS_API_KEY", supportsOAuth: false },
	{ id: "xai", name: "xAI (Grok)", env: "XAI_API_KEY", supportsOAuth: false },
	{ id: "mistral", name: "Mistral", env: "MISTRAL_API_KEY", supportsOAuth: false },
	{ id: "cohere", name: "Cohere", env: "COHERE_API_KEY", supportsOAuth: false },
	{ id: "azure-openai", name: "Azure OpenAI", env: "AZURE_OPENAI_API_KEY", supportsOAuth: false },
	{ id: "bedrock", name: "AWS Bedrock", env: "AWS_PROFILE", supportsOAuth: false },
	{ id: "vertex", name: "Google Vertex AI", env: "GOOGLE_CLOUD_PROJECT", supportsOAuth: false },
];

const THINKING_LEVELS = [
	{ value: "off" as const, label: "Off (fastest)" },
	{ value: "minimal" as const, label: "Minimal" },
	{ value: "low" as const, label: "Low" },
	{ value: "medium" as const, label: "Medium (balanced)" },
	{ value: "high" as const, label: "High (deep reasoning)" },
];

type OnboardingStep =
	| "welcome"
	| "account_type"
	| "organization_info"
	| "providers"
	| "defaults"
	| "preferences"
	| "summary";

interface StepConfig {
	id: OnboardingStep;
	title: string;
	description: string;
}

/** Multi-step onboarding flow for Omukuumi */
export class OnboardingFlowComponent extends Container {
	private stepIndex = 0;
	private data: OnboardingData = {
		accountType: "individual",
		apiKeys: {},
		defaultProvider: "anthropic",
		defaultModel: "",
		thinkingLevel: "medium",
		shareAnalytics: true,
		theme: "dark",
	};
	private readonly options: OnboardingOptions;
	private currentInput: Input | null = null;

	private readonly steps: StepConfig[] = [
		{ id: "welcome", title: "Welcome to Omukuumi", description: "Let's set up your environment" },
		{ id: "account_type", title: "Account Type", description: "Are you an individual or organization?" },
		{ id: "organization_info", title: "Organization Details", description: "Tell us about your organization" },
		{ id: "providers", title: "AI Providers", description: "Configure your AI provider API keys" },
		{ id: "defaults", title: "Default Model", description: "Choose your default AI model" },
		{ id: "preferences", title: "Preferences", description: "Theme, analytics, and thinking level" },
		{ id: "summary", title: "Review & Complete", description: "Review your configuration" },
	];

	constructor(options: OnboardingOptions) {
		super();
		this.options = options;
		this.renderCurrentStep();
	}

	private get currentStep(): StepConfig {
		return this.steps[this.stepIndex];
	}

	private renderCurrentStep(): void {
		this.clear();
		this.addChild(new DynamicBorder());
		this.addChild(new Spacer(1));

		const progress = `${this.stepIndex + 1}/${this.steps.length}`;
		this.addChild(new Text(theme.fg("accent", theme.bold(`Omukuumi Setup — Step ${progress}`)), 1, 0));
		this.addChild(new Spacer(1));

		const progressBar = this.renderProgressBar();
		this.addChild(new Text(theme.fg("accent", progressBar), 1, 0));
		this.addChild(new Spacer(2));

		switch (this.stepIndex) {
			case 0:
				this.renderWelcome();
				break;
			case 1:
				this.renderAccountType();
				break;
			case 2:
				this.renderOrganizationInfo();
				break;
			case 3:
				this.renderProviders();
				break;
			case 4:
				this.renderDefaults();
				break;
			case 5:
				this.renderPreferences();
				break;
			case 6:
				this.renderSummary();
				break;
		}

		this.addChild(new Spacer(2));
		this.addChild(new DynamicBorder());
		this.addChild(new Spacer(1));
		this.renderNavigationHints();
		this.addChild(new Spacer(1));
		this.addChild(new DynamicBorder());
	}

	private renderProgressBar(): string {
		const filled = "█".repeat(this.stepIndex + 1);
		const empty = "░".repeat(this.steps.length - this.stepIndex - 1);
		return `[${filled}${empty}] ${this.currentStep.title}`;
	}

	private renderWelcome(): void {
		this.addChild(new Text(theme.fg("accent", theme.bold("Welcome to Omukuumi")), 1, 0));
		this.addChild(new Spacer(1));
		this.addChild(
			new Text(
				theme.fg(
					"text",
					"Omukuumi is an AI coding assistant for the terminal, sponsored by Genesis Codeworks Foundation.",
				),
				1,
				0,
			),
		);
		this.addChild(new Spacer(1));
		this.addChild(
			new Text(
				theme.fg("text", "We'll help you configure your AI providers, default models, and preferences."),
				1,
				0,
			),
		);
		this.addChild(new Spacer(1));
		this.addChild(
			new Text(theme.fg("muted", "You can skip optional steps and configure them later in settings."), 1, 0),
		);
	}

	private renderAccountType(): void {
		this.addChild(
			new Text(theme.fg("text", "Are you using Omukuumi as an individual or as part of an organization?"), 1, 0),
		);
		this.addChild(new Spacer(1));

		const labels = ACCOUNT_TYPES.map((opt) => opt.label);
		const selected = ACCOUNT_TYPES.findIndex((opt) => opt.value === this.data.accountType);
		this.addOptionList(labels, selected);
	}

	private renderOrganizationInfo(): void {
		this.addChild(new Text(theme.fg("text", "Tell us about your organization"), 1, 0));
		this.addChild(new Spacer(1));

		this.addChild(new Text(theme.fg("text", "Organization Name:"), 1, 0));
		this.currentInput = new Input();
		this.currentInput.setValue(this.data.organizationName || "");
		this.currentInput.onSubmit = () => {
			this.data.organizationName = this.currentInput?.getValue() || "";
			this.nextStep();
		};
		this.addChild(this.currentInput);
		this.addChild(new Spacer(1));

		this.addChild(new Text(theme.fg("text", "Contact Email:"), 1, 0));
		this.currentInput = new Input();
		this.currentInput.setValue(this.data.contactEmail || "");
		this.currentInput.onSubmit = () => {
			this.data.contactEmail = this.currentInput?.getValue() || "";
			this.nextStep();
		};
		this.addChild(this.currentInput);
	}

	private renderProviders(): void {
		this.addChild(new Text(theme.fg("text", "Configure your AI provider API keys"), 1, 0));
		this.addChild(new Spacer(1));
		this.addChild(
			new Text(theme.fg("muted", "Enter API keys for providers you want to use. Leave blank to skip."), 1, 0),
		);
		this.addChild(new Spacer(1));

		for (const provider of PROVIDERS) {
			const existingKey = this.data.apiKeys[provider.env] || "";

			this.addChild(new Spacer(1));
			this.addChild(new Text(theme.fg("text", `${provider.name}:`), 1, 0));
			if (this.data.apiKeys[provider.env]) {
				this.addChild(new Text(theme.fg("success", "✓ Configured"), 1, 0));
			}

			this.currentInput = new Input();
			this.currentInput.setValue(this.data.apiKeys[provider.env] || "");
			this.currentInput.setMasked(true);
			this.currentInput.onSubmit = () => {
				const value = this.currentInput?.getValue() || "";
				if (value) {
					this.data.apiKeys[provider.env] = value;
				}
				this.nextStep();
			};
			this.addChild(this.currentInput);
			this.addChild(new Spacer(1));
		}

		this.addChild(new Spacer(1));
		this.addChild(new Text(theme.fg("muted", "Press Enter to skip to defaults..."), 1, 0));
	}

	private renderDefaults(): void {
		this.addChild(new Text(theme.fg("text", "Choose your default AI provider and model"), 1, 0));
		this.addChild(new Spacer(1));

		this.addChild(new Text(theme.fg("text", "Default Provider:"), 1, 0));
		this.addOptionList(
			PROVIDERS.map((p) => p.name),
			PROVIDERS.findIndex((p) => p.id === this.data.defaultProvider),
		);

		this.addChild(new Spacer(1));

		this.addChild(new Text(theme.fg("text", "Thinking Level:"), 1, 0));
		this.addOptionList(
			THINKING_LEVELS.map((t) => t.label),
			THINKING_LEVELS.findIndex((t) => t.value === this.data.thinkingLevel),
		);
	}

	private renderPreferences(): void {
		this.addChild(new Text(theme.fg("text", "Theme:"), 1, 0));
		this.addOptionList(
			THEME_OPTIONS.map((t) => t.label),
			THEME_OPTIONS.findIndex((t) => t.value === this.data.theme),
		);

		this.addChild(new Spacer(1));

		this.addChild(new Text(theme.fg("text", "Share anonymous usage data?"), 1, 0));
		this.addChild(new Text(theme.fg("muted", "Helps improve Omukuumi. Can be changed in settings."), 1, 0));
		this.addChild(new Spacer(1));

		const analyticsLabels = ["Yes, share anonymous data", "No, don't share"];
		this.addOptionList(analyticsLabels, this.data.shareAnalytics ? 0 : 1);
	}

	private renderSummary(): void {
		this.addChild(new Text(theme.fg("text", "Review your configuration:"), 1, 0));
		this.addChild(new Spacer(1));

		const items = [
			`Account: ${this.data.accountType}${this.data.accountType === "organization" ? ` (${this.data.organizationName || "Unnamed"})` : ""}`,
			`Email: ${this.data.contactEmail || "Not provided"}`,
			`Providers: ${Object.keys(this.data.apiKeys).length} configured`,
			`Default Provider: ${PROVIDERS.find((p) => p.id === this.data.defaultProvider)?.name || "Not set"}`,
			`Thinking Level: ${THINKING_LEVELS.find((t) => t.value === this.data.thinkingLevel)?.label || "Medium"}`,
			`Theme: ${this.data.theme}`,
			`Analytics: ${this.data.shareAnalytics ? "Enabled" : "Disabled"}`,
		];

		for (const item of items) {
			this.addChild(new Text(theme.fg("text", `• ${item}`), 1, 0));
		}

		this.addChild(new Spacer(1));
		this.addChild(new Text(theme.fg("success", "Press Enter to complete setup"), 1, 0));
	}

	private addOptionList(labels: string[], selectedIndex: number): void {
		for (let i = 0; i < labels.length; i++) {
			const isSelected = i === selectedIndex;
			const prefix = theme.fg("accent", isSelected ? "→ " : "  ");
			const label = isSelected ? theme.fg("accent", labels[i]) : theme.fg("text", labels[i]);
			this.addChild(new Text(`${prefix}${labels[i]}`, 1, 0));
		}
	}

	private renderNavigationHints(): void {
		const hints = [];
		if (this.stepIndex > 0) {
			hints.push(keyHint("tui.select.up", "back"));
		}
		if (this.stepIndex < this.steps.length - 1) {
			hints.push(keyHint("tui.select.down", "next"));
		} else {
			hints.push(keyHint("tui.select.confirm", "finish"));
		}
		hints.push(keyHint("tui.select.cancel", "cancel"));
		this.addChild(new Text(hints.join("  "), 1, 0));
	}

	private nextStep(): void {
		if (this.stepIndex < this.steps.length - 1) {
			this.stepIndex++;
			this.renderCurrentStep();
		} else {
			this.submit();
		}
	}

	private prevStep(): void {
		if (this.stepIndex > 0) {
			this.stepIndex--;
			this.renderCurrentStep();
		}
	}

	private submit(): void {
		const data: OnboardingData = {
			accountType: this.data.accountType,
			organizationName: this.data.organizationName,
			contactEmail: this.data.contactEmail,
			apiKeys: this.data.apiKeys,
			defaultProvider: this.data.defaultProvider,
			defaultModel: this.data.defaultModel,
			thinkingLevel: this.data.thinkingLevel,
			shareAnalytics: this.data.shareAnalytics,
			theme: this.data.theme,
		};
		this.options.onSubmit(data);
	}

	handleInput(keyData: string): void {
		const kb = getKeybindings();
		if (kb.matches(keyData, "tui.select.up") || keyData === "k") {
			this.prevStep();
		} else if (kb.matches(keyData, "tui.select.down") || keyData === "j") {
			this.nextStep();
		} else if (kb.matches(keyData, "tui.select.confirm") || keyData === "\n") {
			if (this.stepIndex < this.steps.length - 1) {
				this.nextStep();
			} else {
				this.submit();
			}
		} else if (kb.matches(keyData, "tui.select.cancel")) {
			this.options.onCancel();
		}
	}
}
