import { aiAdapter } from "@/server/ai/adapter";
import { prisma } from "@/server/db/prisma";
import type { JapanRegionId } from "@/shared/lib/constants";

export async function sendChatMessage(params: {
  userId: string;
  message: string;
  sessionId?: string;
  region?: JapanRegionId;
}) {
  let chatSession = params.sessionId
    ? await prisma.chatSession.findFirst({
        where: { id: params.sessionId, userId: params.userId },
      })
    : null;

  if (!chatSession) {
    chatSession = await prisma.chatSession.create({
      data: { userId: params.userId, title: "여행 상담" },
    });
  }

  await prisma.chatMessage.create({
    data: { sessionId: chatSession.id, role: "user", content: params.message },
  });

  const history = await prisma.chatMessage.findMany({
    where: { sessionId: chatSession.id },
    orderBy: { createdAt: "asc" },
    take: 30,
    select: { role: true, content: true },
  });

  const ai = await aiAdapter.chat({
    sessionId: chatSession.id,
    message: params.message,
    region: params.region,
    tripContext: { history },
  });

  await prisma.chatMessage.create({
    data: { sessionId: chatSession.id, role: "assistant", content: ai.reply },
  });

  await prisma.chatSession.update({
    where: { id: chatSession.id },
    data: { updatedAt: new Date() },
  });

  return {
    sessionId: chatSession.id,
    reply: ai.reply,
    suggestedQuestions: ai.suggestedQuestions,
  };
}

export async function getLatestChatSession(userId: string) {
  const chatSession = await prisma.chatSession.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { messages: { orderBy: { createdAt: "asc" }, take: 50 } },
  });

  if (!chatSession) return { messages: [] as { role: string; content: string }[] };

  return {
    sessionId: chatSession.id,
    messages: chatSession.messages.map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  };
}
