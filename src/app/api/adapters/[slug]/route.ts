import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeAdapter } from "@/lib/serialize";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const adapter = await prisma.adapter.findUnique({ where: { slug } });
  if (!adapter) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ adapter: serializeAdapter(adapter) });
}
