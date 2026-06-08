import { NextResponse } from "next/server";
import { listAttractions } from "@/features/attractions/server";
import type { JapanRegionId } from "@/shared/lib/constants";

export async function GET(req: Request) {
  const region = (new URL(req.url).searchParams.get("region") ?? "TOKYO") as JapanRegionId;
  const items = await listAttractions(region);
  return NextResponse.json({ items });
}
