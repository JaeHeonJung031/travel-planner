import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { sendKakaoScheduleMessage } from "@/features/notifications/server/kakao/message";
import { getKstDayRange, getKstTimeKey } from "@/features/notifications/server/time/kst";

function cronSecret() {
  const raw = process.env.CRON_SECRET?.trim();
  if (!raw) return "";
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    return raw.slice(1, -1);
  }
  return raw;
}

export async function GET(req: Request) {
  const secret = cronSecret();
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const timeKey = getKstTimeKey(now);
  const { dayStart, dayEnd, dateLabel } = getKstDayRange(now);

  const settings = await prisma.notificationSetting.findMany({
    where: { enabled: true, notifyTime: timeKey },
    include: {
      user: {
        include: {
          accounts: { where: { provider: "kakao" }, take: 1 },
          trips: {
            where: {
              startDate: { lte: dayEnd },
              endDate: { gte: dayStart },
            },
            include: {
              days: {
                where: { date: { gte: dayStart, lte: dayEnd } },
                include: { items: { orderBy: { sortOrder: "asc" } } },
                take: 1,
              },
            },
            orderBy: { startDate: "asc" },
            take: 1,
          },
        },
      },
    },
  });

  let sent = 0;
  const errors: string[] = [];

  for (const s of settings) {
    if (!s.user.accounts[0]) {
      errors.push(`${s.userId}: 카카오 계정 없음`);
      continue;
    }

    const day = s.user.trips[0]?.days[0];
    const items =
      day?.items.map((i) => ({
        placeName: i.placeName,
        startTime: i.startTime,
        transport: i.transport,
      })) ?? [];

    const result = await sendKakaoScheduleMessage({
      userId: s.userId,
      dateLabel,
      items,
    });

    if (result.ok) sent++;
    else errors.push(`${s.userId}: ${result.error ?? result.mode}`);
  }

  return NextResponse.json({ ok: true, sent, failed: errors.length, time: timeKey, errors });
}
