import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { aiAdapter } from "@/server/ai/adapter";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const result = await aiAdapter.chat(body);
  return NextResponse.json(result);
}
