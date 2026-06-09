import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getLatestChatSession } from "@/features/chat/server";
import { prisma } from "@/server/db/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await getLatestChatSession(session.user.id);
  return NextResponse.json(data);
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 해당 유저의 모든 채팅 세션 + 메시지 삭제
  await prisma.chatSession.deleteMany({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ success: true });
}