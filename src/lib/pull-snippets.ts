import type { AdapterDTO } from "@/lib/serialize";

export function cliDownloadSnippet(adapter: AdapterDTO): string {
  const localDir = `./loras/${adapter.slug}`;
  const includePath = adapter.hfPath ? `${adapter.hfPath}/*` : "*";
  return [
    `huggingface-cli download ${adapter.hfRepoId} \\`,
    `  --include "${includePath}" \\`,
    `  --local-dir ${localDir}`,
  ].join("\n");
}

export function pythonSnippet(adapter: AdapterDTO): string {
  const subfolder = adapter.hfPath ? `, subfolder="${adapter.hfPath}"` : "";
  return [
    "from transformers import AutoModelForCausalLM, AutoTokenizer",
    "from peft import PeftModel",
    "",
    `base_model_id = "<matching base model, e.g. an org/${adapter.baseModel} checkpoint>"`,
    "",
    "tokenizer = AutoTokenizer.from_pretrained(base_model_id)",
    "model = AutoModelForCausalLM.from_pretrained(base_model_id, device_map=\"auto\")",
    "model = PeftModel.from_pretrained(",
    "    model,",
    `    "${adapter.hfRepoId}"${subfolder},`,
    ")",
  ].join("\n");
}

export function modelsConfigSnippet(adapter: AdapterDTO): string {
  const keywords = adapter.tags.filter((t) => t !== adapter.domain).slice(0, 6);
  const lines = [
    "lora_adapters:",
    `  - name: "${toTitle(adapter.domain)}Expert"`,
    `    source: "huggingface"`,
    `    huggingface_id: "${adapter.hfRepoId}"`,
    ...(adapter.hfPath ? [`    subfolder: "${adapter.hfPath}"`] : []),
    `    local_path: "./loras/${adapter.slug}"`,
    `    description: "${adapter.description.replace(/"/g, "'")}"`,
    `    system_prompt: "${(adapter.systemPrompt ?? `You are an expert in ${toTitle(adapter.domain)}.`).replace(/"/g, "'")}"`,
    "    keywords:",
    `      - ${adapter.domain}`,
    ...keywords.map((k) => `      - ${k}`),
    "    enabled: true",
  ];
  return lines.join("\n");
}

function toTitle(s: string): string {
  return s
    .split(/[-\s]/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}
