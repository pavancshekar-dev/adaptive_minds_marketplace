"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/cn";

export function CopyBlock({ label, code }: { label?: string; code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="overflow-hidden rounded-md border border-line bg-surface">
      {label && (
        <div className="flex items-center justify-between border-b border-line px-4 py-2">
          <span className="font-mono text-[11px] uppercase tracking-wide text-dim">{label}</span>
          <button
            onClick={handleCopy}
            className={cn(
              "flex items-center gap-1.5 font-mono text-[11px] transition-colors",
              copied ? "text-ok" : "text-dim hover:text-amber",
            )}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "copied" : "copy"}
          </button>
        </div>
      )}
      <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-ivory">
        <code>{code}</code>
      </pre>
      {!label && (
        <button
          onClick={handleCopy}
          className={cn(
            "absolute right-3 top-3 flex items-center gap-1 font-mono text-[11px]",
            copied ? "text-ok" : "text-dim hover:text-amber",
          )}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>
      )}
    </div>
  );
}
