export const DEFAULT_OPENROUTER_MODELS = [
  "anthropic/claude-sonnet-4.6",
  "anthropic/claude-opus-4.6",
  "openai/gpt-5.2",
  "google/gemini-3-pro-preview",
];

export type ModelProvider =
  | "openai"
  | "anthropic"
  | "google"
  | "meta"
  | "unknown";

export function normalizeModelCode(value: string): string {
  return value.trim();
}

export function isValidModelCode(value: string): boolean {
  const model = normalizeModelCode(value);
  return /^[a-z0-9][a-z0-9-]*\/[a-z0-9][a-z0-9._:-]*$/i.test(model);
}

export function inferProviderFromModelCode(value: string): ModelProvider {
  const provider = normalizeModelCode(value).split("/")[0]?.toLowerCase();

  if (!provider) {
    return "unknown";
  }

  if (provider.includes("openai")) {
    return "openai";
  }
  if (provider.includes("anthropic")) {
    return "anthropic";
  }
  if (provider.includes("google")) {
    return "google";
  }
  if (provider.includes("meta")) {
    return "meta";
  }

  return "unknown";
}

export function sanitizeModelList(models: string[]): string[] {
  const seen = new Set<string>();
  const cleaned: string[] = [];

  for (const model of models) {
    const normalized = normalizeModelCode(model);
    if (!isValidModelCode(normalized) || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    cleaned.push(normalized);
  }

  return cleaned;
}

function titleCaseToken(token: string): string {
  const lower = token.toLowerCase();
  if (lower === "gpt") return "GPT";
  if (lower === "gemini") return "Gemini";
  if (lower === "claude") return "Claude";
  if (lower === "o") return "o";
  if (/^\d+(\.\d+)?$/.test(token)) return token;

  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
}

export function formatModelDisplayName(modelCode: string): string {
  const normalized = normalizeModelCode(modelCode);
  const modelName = normalized.includes("/") ? normalized.split("/")[1] : normalized;

  if (!modelName) {
    return "Select Model";
  }

  return modelName
    .replace(/[-_]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map(titleCaseToken)
    .join(" ");
}

