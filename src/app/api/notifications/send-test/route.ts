import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sendKakaoScheduleMessage } from "@/features/notifications/server/kakao/message";
import { getTodayScheduleForUser } from "@/features/notifications/server/today-schedule";

/** 로그인 사용자에게 지금 카카오톡 테스트 발송 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const schedule = await getTodayScheduleForUser(session.user.id);
  const result = await sendKakaoScheduleMessage({
    userId: session.user.id,
    dateLabel: schedule.dateLabel,
    items: schedule.items,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "발송 실패", preview: result.text },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: "카카오톡으로 일정 메시지를 보냈습니다. (본인 카카오톡 나와의 채팅)",
    preview: result.text,
  });
}
