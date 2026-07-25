import Link from "next/link";
import { Plug } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-graphite/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="group flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded border border-line-bright bg-surface text-amber transition-colors group-hover:border-amber">
            <Plug size={16} strokeWidth={2.25} />
          </span>
          <span className="font-mono text-[15px] tracking-tight text-ivory">
            adaptive<span className="text-amber">/</span>minds
            <span className="text-muted"> marketplace</span>
          </span>
        </Link>
        <nav className="flex items-center gap-6 font-mono text-[13px] text-muted">
          <Link href="/" className="transition-colors hover:text-ivory">
            browse
          </Link>
          <Link href="/upload" className="transition-colors hover:text-ivory">
            upload
          </Link>
          <a
            href="https://huggingface.co/collections/pavan01729/adaptive-minds"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-ivory"
          >
            hf collection ↗
          </a>
        </nav>
      </div>
    </header>
  );
}
