#!/usr/bin/env node
/**
 * Fetch all models from OpenRouter API and write to Omukuumi's models.json.
 *
 * Usage:
 *   node scripts/fetch-openrouter-models.mjs
 *
 * The public OpenRouter models API does not require authentication for listing.
 * Set OPENROUTER_API_KEY if you hit rate limits.
 */

const API_KEY = process.env.OPENROUTER_API_KEY || "";
const MODELS_URL = "https://openrouter.ai/api/v1/models";
const OUTPUT_PATH = process.env.OUTPUT || process.env.HOME + "/.omukuumi/agent/models.json";

async function main() {
  console.log(`Fetching models from ${MODELS_URL}...`);

  const headers = { "Content-Type": "application/json" };
  if (API_KEY) headers["Authorization"] = `Bearer ${API_KEY}`;

  const response = await fetch(MODELS_URL, { headers });

  if (!response.ok) {
    console.error(`HTTP ${response.status}: ${response.statusText}`);
    const text = await response.text();
    console.error(text.slice(0, 500));
    process.exit(1);
  }

  const data = await response.json();
  const models = data.data || [];
  console.log(`Found ${models.length} models on OpenRouter`);

  // Build array of model definitions for the "openrouter" provider
  const modelDefs = [];

  for (const model of models) {
    const id = model.id || model;
    const name = model.name || id;
    const contextWindow = model.context_length || 128000;
    const maxTokens = Math.min(
      model.top_provider?.max_completion_tokens || 16384,
      200000
    );

    const entry = {
      id,
      name,
      contextWindow,
      maxTokens,
    };

    if (model.description) entry.description = model.description;

    modelDefs.push(entry);
  }

  // Sort by ID for consistency
  modelDefs.sort((a, b) => a.id.localeCompare(b.id));

  const output = {
    providers: {
      openrouter: {
        models: modelDefs,
      },
    },
  };

  // Preserve existing auth/apiKey/baseUrl config from current file
  try {
    const fs = await import("fs");
    const existingRaw = fs.readFileSync(OUTPUT_PATH, "utf-8");
    const existing = JSON.parse(existingRaw);
    const existingOR = existing?.providers?.openrouter;
    if (existingOR) {
      // Preserve apiKey, baseUrl, headers, authHeader from existing config
      for (const key of ["apiKey", "baseUrl", "headers", "authHeader", "api", "name"]) {
        if (existingOR[key] !== undefined) {
          output.providers.openrouter[key] = existingOR[key];
        }
      }
      console.log("Preserved existing auth/baseUrl config");
    }
  } catch {
    // No existing file, just write fresh
  }

  await fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`Written ${OUTPUT_PATH}`);
  console.log(`Total models: ${modelDefs.length}`);
}

main().catch((e) => {
  console.error(`Fatal: ${e.message}`);
  process.exit(1);
});