import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadDotEnv } from "dotenv";
import { DEFAULT_BASE_URL, DEFAULT_MODEL, DEFAULT_MODEL_PROVIDER } from "./constants.ts";
import type { RuntimeConfig } from "./types.ts";

let hasLoadedRuntimeEnv = false;

export function loadRuntimeEnv(cwd: string = process.cwd()): void {
  if (hasLoadedRuntimeEnv) {
    return;
  }

  hasLoadedRuntimeEnv = true;

  // Keep explicit process env highest priority while allowing local test files to fill gaps.
  for (const fileName of [".env.local", ".env"]) {
    const filePath = resolve(cwd, fileName);

    if (existsSync(filePath)) {
      loadDotEnv({
        path: filePath,
        quiet: true,
      });
    }
  }
}

export function normalizeBaseUrl(baseUrl: string, modelProvider: string): string {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");

  if (!baseUrl) {
    return modelProvider === DEFAULT_MODEL_PROVIDER ? `${DEFAULT_BASE_URL}/v1` : "";
  }

  if (modelProvider === DEFAULT_MODEL_PROVIDER) {
    return normalizedBaseUrl.endsWith("/v1") ? normalizedBaseUrl : `${normalizedBaseUrl}/v1`;
  }

  return normalizedBaseUrl;
}

export function getRuntimeConfig(): RuntimeConfig {
  loadRuntimeEnv();

  const modelProvider = process.env.RAVEN_ACP_MODEL_PROVIDER ?? DEFAULT_MODEL_PROVIDER;
  const baseUrl = normalizeBaseUrl(process.env.RAVEN_ACP_BASE_URL ?? "", modelProvider);
  const model = process.env.RAVEN_ACP_MODEL ?? DEFAULT_MODEL;
  const apiKey = process.env.RAVEN_ACP_API_KEY ?? process.env.OPENAI_API_KEY ?? "";

  return {
    apiKey,
    baseUrl,
    model,
    modelProvider,
  };
}
