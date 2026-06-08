import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sendChatMessage } from "@/features/chat/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message, sessionId, region } = await req.json();
  const result = await sendChatMessage({
    userId: session.user.id,
    message,
    sessionId,
    region,
  });

  return NextResponse.json(result);
}
