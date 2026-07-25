"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDomain, shortBaseModel } from "@/lib/format";
import type { Facets } from "@/lib/queries";

function useParamUpdater() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      startTransition(() => {
        router.push(`${pathname}?${next.toString()}`, { scroll: false });
      });
    },
    [router, pathname, searchParams],
  );

  return { setParam, searchParams, isPending };
}

export function SearchBar() {
  const { setParam, searchParams } = useParamUpdater();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    const handle = setTimeout(() => setParam("q", value || null), 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative">
      <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-dim" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="search adapters — try 'legal', 'grpo', 'quantum'…"
        className="w-full rounded-md border border-line bg-surface py-3 pl-10 pr-10 font-mono text-[13px] text-ivory placeholder:text-dim focus:border-amber focus:outline-none"
      />
      {value && (
        <button
          onClick={() => setValue("")}
          aria-label="Clear search"
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dim hover:text-ivory"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}

function FilterGroup({
  title,
  paramKey,
  options,
  render,
}: {
  title: string;
  paramKey: string;
  options: { value: string; count: number }[];
  render?: (value: string) => string;
}) {
  const { setParam, searchParams } = useParamUpdater();
  const active = searchParams.get(paramKey);
  if (options.length === 0) return null;

  const sorted = [...options].sort((a, b) => b.count - a.count);

  return (
    <div>
      <h4 className="mb-2 font-mono text-[11px] uppercase tracking-wider text-dim">{title}</h4>
      <div className="scroll-thin flex max-h-56 flex-col gap-0.5 overflow-y-auto pr-1">
        {sorted.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setParam(paramKey, active === opt.value ? null : opt.value)}
            className={cn(
              "flex items-center justify-between rounded px-2 py-1.5 text-left font-mono text-[12px] transition-colors",
              active === opt.value
                ? "bg-amber-soft text-amber"
                : "text-muted hover:bg-surface-raised hover:text-ivory",
            )}
          >
            <span className="capitalize">{render ? render(opt.value) : opt.value}</span>
            <span className="text-dim">{opt.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function FilterSidebar({ facets }: { facets: Facets }) {
  const { setParam, searchParams } = useParamUpdater();
  const source = searchParams.get("source");
  const hasAnyFilter = ["baseModel", "domain", "method", "source"].some((k) => searchParams.get(k));

  return (
    <aside className="flex w-full flex-col gap-6 lg:w-56 lg:shrink-0">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="font-mono text-[11px] uppercase tracking-wider text-dim">Source</h4>
          {hasAnyFilter && (
            <button
              onClick={() => {
                setParam("baseModel", null);
                setParam("domain", null);
                setParam("method", null);
                setParam("source", null);
              }}
              className="font-mono text-[11px] text-dim hover:text-amber"
            >
              clear
            </button>
          )}
        </div>
        <div className="flex gap-1.5">
          {(["official", "community"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setParam("source", source === s ? null : s)}
              className={cn(
                "flex-1 rounded border px-2 py-1.5 font-mono text-[11px] capitalize transition-colors",
                source === s
                  ? "border-amber/40 bg-amber-soft text-amber"
                  : "border-line text-muted hover:border-line-bright hover:text-ivory",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <FilterGroup title="Base model" paramKey="baseModel" options={facets.baseModels} render={shortBaseModel} />
      <FilterGroup title="Domain" paramKey="domain" options={facets.domains} render={formatDomain} />
      <FilterGroup title="Method" paramKey="method" options={facets.methods} />
    </aside>
  );
}
