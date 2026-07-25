import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { serializeAdapter } from "@/lib/serialize";
import { listAdapters } from "@/lib/queries";
import { fetchRepoJsonFile, fetchRepoTree, repoExists, type LoraAdapterConfig } from "@/lib/hf";
import { slugify } from "@/lib/adapter-naming";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const adapters = await listAdapters({
    q: searchParams.get("q")?.trim() || undefined,
    baseModel: searchParams.get("baseModel") || undefined,
    domain: searchParams.get("domain") || undefined,
    method: searchParams.get("method") || undefined,
    source: searchParams.get("source") || undefined,
  });

  return NextResponse.json({ adapters });
}

const RegisterSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().min(1).max(2000),
  systemPrompt: z.string().max(2000).optional().nullable(),
  baseModel: z.string().min(1),
  domain: z.string().min(1),
  method: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  hfRepoId: z
    .string()
    .regex(/^[\w-]+\/[\w.-]+$/, "must look like 'namespace/repo-name'"),
  hfPath: z.string().default(""),
  uploaderUsername: z.string().min(1),
});

// Registers an adapter that the browser has *already* uploaded to the Hub
// (see UploadForm — the write token never reaches this server). We re-derive
// the LoRA config and size from the public repo ourselves rather than trust
// client-supplied values, and require adapter_config.json to actually be
// present as proof the upload succeeded.
export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = RegisterSchema.safeParse(json);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const message =
      Object.entries(flat.fieldErrors)
        .map(([field, errors]) => `${field}: ${errors?.[0]}`)
        .join("; ") || "Invalid input.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
  const body = parsed.data;
  const hfPath = body.hfPath.replace(/^\/+|\/+$/g, "");
  const configPath = hfPath ? `${hfPath}/adapter_config.json` : "adapter_config.json";

  if (!(await repoExists(body.hfRepoId))) {
    return NextResponse.json(
      { error: `Repo ${body.hfRepoId} was not found on the Hub (is it public?)` },
      { status: 422 },
    );
  }

  const config = await fetchRepoJsonFile<LoraAdapterConfig>(body.hfRepoId, configPath);
  if (!config) {
    return NextResponse.json(
      { error: `Could not read ${configPath} from ${body.hfRepoId} — upload may not have finished.` },
      { status: 422 },
    );
  }

  const tree = await fetchRepoTree(body.hfRepoId).catch(() => []);
  const prefix = hfPath ? `${hfPath}/` : "";
  const sizeBytes = tree
    .filter((e) => e.type === "file" && e.path.startsWith(prefix))
    .reduce((sum, e) => sum + e.size, 0);

  const baseSlug = slugify(body.hfRepoId.split("/")[1] ?? body.hfRepoId, body.name);
  let slug = baseSlug;
  for (let i = 2; await prisma.adapter.findUnique({ where: { slug } }); i++) {
    slug = `${baseSlug}-${i}`;
  }

  const created = await prisma.adapter.create({
    data: {
      slug,
      name: body.name,
      description: body.description,
      systemPrompt: body.systemPrompt ?? null,
      baseModel: body.baseModel,
      domain: body.domain,
      method: body.method ?? null,
      tags: JSON.stringify(body.tags),
      hfRepoId: body.hfRepoId,
      hfPath,
      rank: config.r ?? null,
      loraAlpha: config.lora_alpha ?? null,
      loraDropout: config.lora_dropout ?? null,
      targetModules: config.target_modules ? JSON.stringify(config.target_modules) : null,
      sizeBytes: BigInt(sizeBytes),
      source: "community",
      uploaderUsername: body.uploaderUsername,
    },
  });

  return NextResponse.json({ adapter: serializeAdapter(created) }, { status: 201 });
}
