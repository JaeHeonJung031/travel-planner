import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { aiAdapter } from "@/server/ai/adapter";
import type { ItineraryGenerateRequest } from "@/server/ai/types";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as ItineraryGenerateRequest;
  const result = await aiAdapter.generateItinerary(body);
  return NextResponse.json(result);
}
