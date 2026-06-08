import { prisma } from "@/server/db/prisma";
import { formatScheduleMessage, type ScheduleItemPayload } from "./schedule-message";
import { getValidKakaoAccessToken, sendKakaoTalkMemo } from "./talk-api";

export type { ScheduleItemPayload };

export async function sendKakaoScheduleMessage(params: {
  userId: string;
  dateLabel: string;
  items: ScheduleItemPayload[];
}) {
  const text = formatScheduleMessage(params.dateLabel, params.items);

  const kakaoAccount = await prisma.account.findFirst({
    where: { userId: params.userId, provider: "kakao" },
    select: {
      id: true,
      access_token: true,
      refresh_token: true,
      expires_at: true,
    },
  });

  if (!kakaoAccount?.access_token && !kakaoAccount?.refresh_token) {
    return {
      ok: false,
      mode: "no_token" as const,
      text,
      error: "카카오 로그인(메시지 동의) 후 다시 시도하세요.",
    };
  }

  try {
    const accessToken = await getValidKakaoAccessToken(kakaoAccount);
    await sendKakaoTalkMemo(accessToken, text);
    return { ok: true, mode: "kakaotalk" as const, text };
  } catch (e) {
    const message = e instanceof Error ? e.message : "카카오톡 발송 실패";
    console.error("[kakao] send failed:", message);
    return { ok: false, mode: "error" as const, text, error: message };
  }
}
