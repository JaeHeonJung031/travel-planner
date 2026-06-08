import { prisma } from "@/server/db/prisma";

/** 카카오 로그인 시 알림 설정에 카카오 사용자 ID 저장 */
export async function syncKakaoUserForNotifications(
  userId: string,
  kakaoProviderAccountId: string,
) {
  await prisma.notificationSetting.upsert({
    where: { userId },
    create: {
      userId,
      enabled: true,
      notifyTime: "08:00",
      kakaoUserId: kakaoProviderAccountId,
    },
    update: { kakaoUserId: kakaoProviderAccountId },
  });
}
