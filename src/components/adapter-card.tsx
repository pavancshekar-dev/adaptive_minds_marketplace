import Link from "next/link";
import type { AdapterDTO } from "@/lib/serialize";
import { formatBytes, formatDomain, shortBaseModel } from "@/lib/format";

export function AdapterCard({ adapter }: { adapter: AdapterDTO }) {
  return (
    <Link
      href={`/adapters/${adapter.slug}`}
      className="module-notch group relative flex flex-col gap-3 rounded-md border border-line bg-surface p-5 pt-6 transition-all hover:border-amber/50 hover:bg-surface-raised"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-mono text-[13.5px] leading-snug text-ivory break-all">
          {adapter.name}
        </h3>
        {adapter.source === "official" ? (
          <span className="shrink-0 rounded-sm border border-amber/30 bg-amber-soft px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-amber">
            official
          </span>
        ) : (
          <span className="shrink-0 rounded-sm border border-slate/30 bg-slate-soft px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-slate">
            community
          </span>
        )}
      </div>

      <p className="line-clamp-2 text-[13px] leading-relaxed text-muted">{adapter.description}</p>

      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        <span className="rounded-sm border border-slate/30 bg-slate-soft px-2 py-0.5 font-mono text-[11px] text-slate">
          {shortBaseModel(adapter.baseModel)}
        </span>
        <span className="rounded-sm border border-line-bright px-2 py-0.5 font-mono text-[11px] capitalize text-muted">
          {formatDomain(adapter.domain)}
        </span>
        {adapter.method && (
          <span className="rounded-sm border border-line-bright px-2 py-0.5 font-mono text-[11px] uppercase text-dim">
            {adapter.method}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-line pt-3 font-mono text-[11px] text-dim">
        <span>
          r{adapter.rank ?? "?"}
          <span className="text-line-bright"> / </span>α{adapter.loraAlpha ?? "?"}
        </span>
        <span>{formatBytes(adapter.sizeBytes)}</span>
      </div>
    </Link>
  );
}
