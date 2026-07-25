import type { Adapter } from "@/generated/prisma/client";

export type AdapterDTO = Omit<
  Adapter,
  "tags" | "targetModules" | "sizeBytes" | "createdAt" | "updatedAt"
> & {
  tags: string[];
  targetModules: string[] | null;
  sizeBytes: number | null;
  createdAt: string;
  updatedAt: string;
};

export function serializeAdapter(adapter: Adapter): AdapterDTO {
  return {
    ...adapter,
    tags: safeParseArray(adapter.tags),
    targetModules: adapter.targetModules ? safeParseArray(adapter.targetModules) : null,
    sizeBytes: adapter.sizeBytes != null ? Number(adapter.sizeBytes) : null,
    createdAt: adapter.createdAt.toISOString(),
    updatedAt: adapter.updatedAt.toISOString(),
  };
}

function safeParseArray(json: string): string[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
