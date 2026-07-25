export function generateAdapterReadme(input: {
  name: string;
  description: string;
  baseModel: string;
  domain: string;
  tags: string[];
}): string {
  const tags = Array.from(new Set(["lora", "peft", "adaptive-minds", ...input.tags]));
  return `---
tags:
${tags.map((t) => `  - ${t}`).join("\n")}
base_model: ${input.baseModel}
library_name: peft
---

# ${input.name}

${input.description}

Published from the [Adaptive Minds Marketplace](https://huggingface.co/collections/pavan01729/adaptive-minds).

## Usage

\`\`\`python
from transformers import AutoModelForCausalLM
from peft import PeftModel

model = AutoModelForCausalLM.from_pretrained("${input.baseModel}", device_map="auto")
model = PeftModel.from_pretrained(model, "<this-repo-id>")
\`\`\`
`;
}
