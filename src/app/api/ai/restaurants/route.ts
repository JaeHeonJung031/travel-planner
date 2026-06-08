import { NextResponse } from "next/server";
import { searchRestaurants } from "@/features/restaurants/server";
import type { JapanRegionId } from "@/shared/lib/constants";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const region = (searchParams.get("region") ?? "TOKYO") as JapanRegionId;

  const items = await searchRestaurants({
    region,
    maxBudgetKrw: Number(searchParams.get("maxBudgetKrw") ?? 30000),
    maxDistanceKm: Number(searchParams.get("maxDistanceKm") ?? 2),
    minRating: Number(searchParams.get("minRating") ?? 4),
  });

  return NextResponse.json({ items });
}
