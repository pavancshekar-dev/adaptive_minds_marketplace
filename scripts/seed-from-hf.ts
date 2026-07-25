import "dotenv/config";
import yaml from "js-yaml";
import { prisma } from "../src/lib/prisma";
import { fetchRepoTree, fetchRepoJsonFile, fetchRepoTextFile, type LoraAdapterConfig } from "../src/lib/hf";
import { baseModelDisplayName, parseAdapterName, slugify } from "../src/lib/adapter-naming";

const COLLECTION_REPO = "pavan01729/adaptive-minds-loras";

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function parseReadmeFrontmatter(readme: string): { description?: string; tags?: string[]; base_model?: string } {
  const match = readme.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    const firstParagraph = readme.split(/\n\s*\n/).find((p) => p.trim().length > 0);
    return { description: firstParagraph?.trim() };
  }
  const [, frontmatter, body] = match;
  let parsed: Record<string, unknown> = {};
  try {
    parsed = (yaml.load(frontmatter) as Record<string, unknown>) ?? {};
  } catch {
    // malformed frontmatter, fall through with body-derived description only
  }
  const firstParagraph = body
    .split(/\n\s*\n/)
    .map((p) =>
      p
        .replace(/^#.*$/gm, "")
        .replace(/^>\s?/gm, "")
        .trim(),
    )
    .find((p) => p.length > 0);

  return {
    description: (parsed.description as string) ?? firstParagraph,
    tags: Array.isArray(parsed.tags) ? (parsed.tags as string[]) : undefined,
    base_model: parsed.base_model as string | undefined,
  };
}

async function main() {
  console.log(`Crawling ${COLLECTION_REPO} ...`);
  const tree = await fetchRepoTree(COLLECTION_REPO);
  console.log(`Fetched ${tree.length} tree entries.`);

  const configFiles = tree.filter((e) => e.type === "file" && e.path.endsWith("/adapter_config.json"));
  console.log(`Found ${configFiles.length} adapter_config.json files.`);

  const bySize = new Map<string, number>();
  for (const entry of tree) {
    if (entry.type !== "file") continue;
    bySize.set(entry.path, entry.size);
  }

  type AdapterDir = { baseModelFolder: string; adapterDirName: string; dirPath: string };
  const adapterDirs: AdapterDir[] = configFiles.map((f) => {
    const segments = f.path.split("/");
    const baseModelFolder = segments[0];
    const adapterDirName = segments.slice(1, -1).join("/");
    return { baseModelFolder, adapterDirName, dirPath: `${baseModelFolder}/${adapterDirName}` };
  });

  let created = 0;
  let updated = 0;
  let skipped = 0;

  await mapWithConcurrency(adapterDirs, 8, async ({ baseModelFolder, adapterDirName, dirPath }) => {
    const configPath = `${dirPath}/adapter_config.json`;
    const config = await fetchRepoJsonFile<LoraAdapterConfig>(COLLECTION_REPO, configPath);
    if (!config) {
      console.warn(`  skip (no readable config): ${dirPath}`);
      skipped++;
      return;
    }

    const hasReadme = bySize.has(`${dirPath}/README.md`);
    const readme = hasReadme ? await fetchRepoTextFile(COLLECTION_REPO, `${dirPath}/README.md`) : null;
    const front = readme ? parseReadmeFrontmatter(readme) : {};

    const sizeBytes = Array.from(bySize.entries())
      .filter(([path]) => path.startsWith(`${dirPath}/`))
      .reduce((sum, [, size]) => sum + size, 0);

    const { domain, method, tags } = parseAdapterName(adapterDirName);
    const baseModel = baseModelDisplayName(baseModelFolder);
    const slug = slugify(baseModelFolder, adapterDirName);

    const description =
      front.description?.trim() ||
      `${domain.replace(/-/g, " ")} domain-expert LoRA adapter fine-tuned on ${baseModel}.`;

    const allTags = Array.from(new Set([...(front.tags ?? []), ...tags, domain]));

    const data = {
      name: adapterDirName,
      description,
      baseModel,
      domain,
      method,
      tags: JSON.stringify(allTags),
      hfRepoId: COLLECTION_REPO,
      hfPath: dirPath,
      rank: config.r ?? null,
      loraAlpha: config.lora_alpha ?? null,
      loraDropout: config.lora_dropout ?? null,
      targetModules: config.target_modules ? JSON.stringify(config.target_modules) : null,
      sizeBytes: BigInt(sizeBytes),
      source: "official",
      uploaderUsername: "pavan01729",
    };

    const existing = await prisma.adapter.findUnique({ where: { slug } });
    await prisma.adapter.upsert({
      where: { slug },
      create: { slug, ...data },
      update: data,
    });
    if (existing) updated++;
    else created++;
  });

  console.log(`Done. Created ${created}, updated ${updated}, skipped ${skipped}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
