// Heuristics for turning the free-form folder names in the collection repo
// (e.g. "qwen25_legal_v1_grpo", "llama-8B-chemistry-v2-low") into searchable
// facets. This is best-effort — it drives filter chips, not ground truth.

export const BASE_MODEL_REGISTRY: Record<string, string> = {
  "llama-3.1-8b": "Meta-Llama-3.1-8B-Instruct",
  "qwen2.5-7b": "Qwen2.5-7B-Instruct",
  "qwen3.5-9b": "Qwen3.5-9B",
  qwen3: "Qwen3-8B",
  misc: "Misc / experimental",
};

export function baseModelDisplayName(folder: string): string {
  return BASE_MODEL_REGISTRY[folder] ?? folder;
}

const PREFIX_PATTERNS: RegExp[] = [
  /^qwen25at[-_]?/i,
  /^qwen2\.5-7b-?/i,
  /^qwen25[-_]?/i,
  /^qwen3\.5-9b-?/i,
  /^qwen35[-_]?/i,
  /^qwen3[-_]?/i,
  /^llama-3\.1-8b-?/i,
  /^llama-?8b[-_]?/i,
  /^llama8b[-_]?/i,
];

const METHOD_TOKENS = new Set(["grpo", "sft", "dpo", "ppo", "rl", "cpt", "s1", "s2", "s3"]);
const STATUS_TOKENS = new Set([
  "low", "med", "high", "fixed", "stuck", "hacked", "gated", "warm", "midtrain",
  "optim", "peft", "ablation", "demo", "smoke", "reasoning", "hf",
]);
const DROP_TOKENS = new Set(["", "v1", "v2", "v3", "v15p1", "v15p2", "v15p3", "v23", "adapter", "loraadapter"]);

export type ParsedAdapterName = {
  domain: string;
  method: string | null;
  tags: string[];
};

export function parseAdapterName(dirName: string): ParsedAdapterName {
  let rest = dirName;
  for (const pattern of PREFIX_PATTERNS) {
    if (pattern.test(rest)) {
      rest = rest.replace(pattern, "");
      break;
    }
  }

  const tokens = rest
    .replace(/\./g, "_")
    .split(/[-_]+/)
    .map((t) => t.toLowerCase())
    .filter(Boolean);

  const domainTokens: string[] = [];
  const tags: string[] = [];
  let method: string | null = null;

  for (const token of tokens) {
    if (/^v\d+[a-z0-9]*$/.test(token) || DROP_TOKENS.has(token)) continue;
    if (METHOD_TOKENS.has(token)) {
      method = method ?? token;
      tags.push(token);
      continue;
    }
    if (STATUS_TOKENS.has(token)) {
      tags.push(token);
      continue;
    }
    domainTokens.push(token);
  }

  const domain = (domainTokens.length ? domainTokens : tokens).join("-") || "general";
  return { domain, method, tags: Array.from(new Set(tags)) };
}

export function slugify(...parts: string[]): string {
  return parts
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
