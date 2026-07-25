export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function formatDomain(domain: string): string {
  return domain.replace(/-/g, " ");
}

const BASE_MODEL_SHORT: Record<string, string> = {
  "Meta-Llama-3.1-8B-Instruct": "Llama-3.1-8B",
  "Qwen2.5-7B-Instruct": "Qwen2.5-7B",
  "Qwen3.5-9B": "Qwen3.5-9B",
  "Qwen3-8B": "Qwen3-8B",
  "Misc / experimental": "Misc",
};

export function shortBaseModel(baseModel: string): string {
  return BASE_MODEL_SHORT[baseModel] ?? baseModel;
}
