import { listAdapters, getFacets } from "@/lib/queries";
import { formatBytes } from "@/lib/format";
import { AdapterCard } from "@/components/adapter-card";
import { SearchBar, FilterSidebar } from "@/components/filters";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  q?: string;
  baseModel?: string;
  domain?: string;
  method?: string;
  source?: string;
}>;

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const [adapters, facets] = await Promise.all([listAdapters(params), getFacets()]);
  const totalSize = adapters.reduce((sum, a) => sum + (a.sizeBytes ?? 0), 0);
  const hasFilters = Object.values(params).some(Boolean);

  return (
    <div className="mx-auto max-w-7xl px-6 pb-24">
      <section className="relative overflow-hidden border-b border-line py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-0 select-none font-mono text-[13px] leading-relaxed text-line-bright/60"
        >
          <pre className="hidden lg:block">{`  W' = W + BA
  ┌──────┐   ┌───┐┌───┐
  │  W   │ + │ B ││ A │
  │ d×d  │   │d×r││r×d│
  └──────┘   └───┘└───┘
             frozen  ↑
                   swap me`}</pre>
        </div>

        <p className="font-mono text-[12px] uppercase tracking-[0.2em] text-amber">
          adaptive minds / marketplace
        </p>
        <h1 className="mt-3 max-w-2xl font-mono text-4xl leading-tight tracking-tight text-ivory sm:text-5xl">
          Slot in a domain expert.
          <br />
          <span className="text-muted">Keep the base model frozen.</span>
        </h1>
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted">
          Browse LoRA adapters trained for the Adaptive Minds agent runtime, pull the exact
          command to load one, or publish your own — every file is hosted on the Hugging Face
          Hub, this catalog just makes it searchable.
        </p>

        <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-3 font-mono text-[13px]">
          <div>
            <dt className="text-dim">adapters</dt>
            <dd className="text-lg text-ivory">{adapters.length}</dd>
          </div>
          <div>
            <dt className="text-dim">base models</dt>
            <dd className="text-lg text-ivory">{facets.baseModels.length}</dd>
          </div>
          <div>
            <dt className="text-dim">domains</dt>
            <dd className="text-lg text-ivory">{facets.domains.length}</dd>
          </div>
          <div>
            <dt className="text-dim">on-disk</dt>
            <dd className="text-lg text-ivory">{formatBytes(totalSize)}</dd>
          </div>
        </dl>
      </section>

      <section className="flex flex-col gap-8 py-10 lg:flex-row">
        <FilterSidebar facets={facets} />

        <div className="flex-1">
          <SearchBar />

          <div className="mt-5 flex items-center justify-between font-mono text-[12px] text-dim">
            <span>
              {adapters.length} adapter{adapters.length === 1 ? "" : "s"}
              {hasFilters ? " matching filters" : ""}
            </span>
          </div>

          {adapters.length === 0 ? (
            <div className="mt-6 rounded-md border border-dashed border-line py-16 text-center">
              <p className="font-mono text-[13px] text-muted">No adapters match those filters.</p>
              <p className="mt-1 text-[12px] text-dim">Try clearing a filter or searching a broader term.</p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {adapters.map((adapter) => (
                <AdapterCard key={adapter.id} adapter={adapter} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
