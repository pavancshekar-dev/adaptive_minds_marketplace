import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { serializeAdapter, type AdapterDTO } from "@/lib/serialize";

export type AdapterFilters = {
  q?: string;
  baseModel?: string;
  domain?: string;
  method?: string;
  source?: string;
};

export function buildAdapterWhere(filters: AdapterFilters): Prisma.AdapterWhereInput {
  const { q, baseModel, domain, method, source } = filters;
  return {
    ...(baseModel ? { baseModel } : {}),
    ...(domain ? { domain } : {}),
    ...(method ? { method } : {}),
    ...(source ? { source } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q } },
            { description: { contains: q } },
            { domain: { contains: q } },
            { tags: { contains: q } },
          ],
        }
      : {}),
  };
}

export async function listAdapters(filters: AdapterFilters): Promise<AdapterDTO[]> {
  const adapters = await prisma.adapter.findMany({
    where: buildAdapterWhere(filters),
    orderBy: [{ source: "asc" }, { createdAt: "desc" }],
  });
  return adapters.map(serializeAdapter);
}

export type Facets = {
  baseModels: { value: string; count: number }[];
  domains: { value: string; count: number }[];
  methods: { value: string; count: number }[];
};

export async function getFacets(): Promise<Facets> {
  const [baseModels, domains, methods] = await Promise.all([
    prisma.adapter.groupBy({ by: ["baseModel"], _count: true, orderBy: { baseModel: "asc" } }),
    prisma.adapter.groupBy({ by: ["domain"], _count: true, orderBy: { domain: "asc" } }),
    prisma.adapter.groupBy({ by: ["method"], _count: true, orderBy: { method: "asc" } }),
  ]);

  return {
    baseModels: baseModels.map((b) => ({ value: b.baseModel, count: b._count })),
    domains: domains.map((d) => ({ value: d.domain, count: d._count })),
    methods: methods.filter((m) => m.method).map((m) => ({ value: m.method as string, count: m._count })),
  };
}
