#!/usr/bin/env node
/**
 * Fetch all models from OpenRouter API and write to Omukuumi's models.json.
 *
 * Usage:
 *   OPENROUTER_API_KEY=sk-or-v1-... node scripts/fetch-openrouter-models.mjs
 *
 * Requires OPENROUTER_API_KEY env var.
 */

const API_KEY = process.env.OPENROUTER_API_KEY;
if (!API_KEY) {
  console.error("ERROR: OPENROUTER_API_KEY environment variable is required");
  process.exit(1);
}

const MODELS_URL = "https://openrouter.ai/api/v1/models";
const OUTPUT_PATH = process.env.OUTPUT || process.env.HOME + "/.omukuumi/agent/models.json";

async function main() {
  console.log(`Fetching models from ${MODELS_URL}...`);
  
  const response = await fetch(MODELS_URL, {
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    console.error(`HTTP ${response.status}: ${response.statusText}`);
    const text = await response.text();
    console.error(text.slice(0, 500));
    process.exit(1);
  }

  const data = await response.json();
  const models = data.data || [];

  console.log(`Found ${models.length} models on OpenRouter`);

  // Build provider config
  const providers = {};
  
  for (const model of models) {
    const id = model.id;
    const fullId = id.includes("/") ? id : `openai/${id}`;
    
    // Determine provider from model ID
    const parts = id.split("/");
    const modelProvider = parts.length > 1 ? parts[0] : "openai";
    const modelName = parts.length > 1 ? parts.slice(1).join("/") : id;

    if (!providers[modelProvider]) {
      providers[modelProvider] = { models: {} };
    }

    const contextWindow = model.context_length || 128000;
    const maxOutput = Math.min(model.top_provider?.max_completion_tokens || 4096, 100000);

    providers[modelProvider].models[id] = {
      id,
      provider: "openrouter",
      label: model.name || id,
      contextWindow,
      maxOutput,
      description: model.description || undefined,
      pricing: model.pricing ? {
        prompt: model.pricing.prompt,
        completion: model.pricing.completion,
      } : undefined,
    };
  }

  // If OpenAI provider has models, merge them under openrouter
  if (providers.openai) {
    // OpenAI models are accessible via OpenRouter with openai/ prefix
  }

  const output = { providers };

  // Read existing to merge if needed
  try {
    const fs = await import("fs");
    const existing = JSON.parse(fs.readFileSync(OUTPUT_PATH, "utf-8"));
    if (existing.providers) {
      // Merge: OpenRouter providers take precedence
      for (const [p, config] of Object.entries(existing.providers)) {
        if (!output.providers[p]) {
          output.providers[p] = config;
        }
      }
    }
  } catch {}

  await fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`Written ${OUTPUT_PATH}`);
  console.log(`Providers: ${Object.keys(output.providers).join(", ")}`);
  
  let totalModels = 0;
  for (const [, config] of Object.entries(output.providers)) {
    totalModels += Object.keys(config.models).length;
  }
  console.log(`Total models: ${totalModels}`);
}

main().catch((e) => {
  console.error(`Fatal: ${e.message}`);
  process.exit(1);
});