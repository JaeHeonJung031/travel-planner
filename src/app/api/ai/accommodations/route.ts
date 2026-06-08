import { NextResponse } from "next/server";
import { searchStays } from "@/features/stays/server";
import type { JapanRegionId } from "@/shared/lib/constants";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const region = (searchParams.get("region") ?? "TOKYO") as JapanRegionId;

  const items = await searchStays({
    region,
    checkIn: searchParams.get("checkIn") ?? "",
    checkOut: searchParams.get("checkOut") ?? "",
    guests: Number(searchParams.get("guests") ?? 2),
    budgetKrw: Number(searchParams.get("budgetKrw") ?? 200000),
    types: searchParams.get("types")?.split(",") as ("HOTEL" | "RYOKAN" | "GUESTHOUSE")[] | undefined,
  });

  return NextResponse.json({ items });
}
