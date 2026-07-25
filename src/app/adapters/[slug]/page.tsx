import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { serializeAdapter } from "@/lib/serialize";
import { formatBytes, formatDomain, shortBaseModel } from "@/lib/format";
import { cliDownloadSnippet, modelsConfigSnippet, pythonSnippet } from "@/lib/pull-snippets";
import { CopyBlock } from "@/components/copy-block";

export const dynamic = "force-dynamic";

export default async function AdapterDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const row = await prisma.adapter.findUnique({ where: { slug } });
  if (!row) notFound();
  const adapter = serializeAdapter(row);

  const hfUrl = adapter.hfPath
    ? `https://huggingface.co/${adapter.hfRepoId}/tree/main/${adapter.hfPath}`
    : `https://huggingface.co/${adapter.hfRepoId}`;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 font-mono text-[12px] text-dim transition-colors hover:text-ivory"
      >
        <ArrowLeft size={13} /> back to marketplace
      </Link>

      <div className="module-notch mt-6 rounded-md border border-line bg-surface p-7 pt-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="font-mono text-xl leading-snug text-ivory break-all">{adapter.name}</h1>
          {adapter.source === "official" ? (
            <span className="shrink-0 rounded-sm border border-amber/30 bg-amber-soft px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-amber">
              official
            </span>
          ) : (
            <span className="shrink-0 rounded-sm border border-slate/30 bg-slate-soft px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-slate">
              community · {adapter.uploaderUsername}
            </span>
          )}
        </div>

        <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted">
          {adapter.description}
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <span className="rounded-sm border border-slate/30 bg-slate-soft px-2 py-0.5 font-mono text-[11px] text-slate">
            {shortBaseModel(adapter.baseModel)}
          </span>
          <span className="rounded-sm border border-line-bright px-2 py-0.5 font-mono text-[11px] capitalize text-muted">
            {formatDomain(adapter.domain)}
          </span>
          {adapter.tags
            .filter((t) => t !== adapter.domain)
            .map((tag) => (
              <span
                key={tag}
                className="rounded-sm border border-line-bright px-2 py-0.5 font-mono text-[11px] text-dim"
              >
                {tag}
              </span>
            ))}
        </div>

        <a
          href={hfUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex items-center gap-1.5 font-mono text-[12px] text-amber hover:underline"
        >
          view on hugging face <ExternalLink size={12} />
        </a>
      </div>

      <section className="mt-8">
        <h2 className="font-mono text-[11px] uppercase tracking-wider text-dim">LoRA config</h2>
        <dl className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-4">
          <Spec label="rank (r)" value={adapter.rank ?? "—"} />
          <Spec label="alpha" value={adapter.loraAlpha ?? "—"} />
          <Spec label="dropout" value={adapter.loraDropout ?? "—"} />
          <Spec label="size" value={formatBytes(adapter.sizeBytes)} />
        </dl>
        {adapter.targetModules && adapter.targetModules.length > 0 && (
          <p className="mt-3 font-mono text-[12px] text-dim">
            target modules: <span className="text-muted">{adapter.targetModules.join(", ")}</span>
          </p>
        )}
      </section>

      <section className="mt-10 flex flex-col gap-5">
        <h2 className="font-mono text-[11px] uppercase tracking-wider text-dim">Pull this adapter</h2>

        <CopyBlock label="huggingface-cli" code={cliDownloadSnippet(adapter)} />
        <CopyBlock label="python — transformers + peft" code={pythonSnippet(adapter)} />
        <CopyBlock
          label="playground/models_config.yaml — adaptive-minds-oss"
          code={modelsConfigSnippet(adapter)}
        />
      </section>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-surface px-4 py-3">
      <dt className="font-mono text-[10px] uppercase tracking-wide text-dim">{label}</dt>
      <dd className="mt-0.5 font-mono text-[14px] text-ivory">{value}</dd>
    </div>
  );
}
