import { NextResponse } from "next/server";
import { getFacets } from "@/lib/queries";

export async function GET() {
  return NextResponse.json(await getFacets());
}
