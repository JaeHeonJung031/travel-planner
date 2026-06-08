import { prisma } from "@/server/db/prisma";
import type { ScheduleItemPayload } from "@/features/notifications/server/kakao/schedule-message";
import { getKstDateLabel, getKstDayRange } from "@/features/notifications/server/time/kst";

export async function getTodayScheduleForUser(userId: string) {
  const now = new Date();
  const { dayStart, dayEnd } = getKstDayRange(now);

  const trip = await prisma.trip.findFirst({
    where: {
      userId,
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
  });

  const day = trip?.days[0];
  const items: ScheduleItemPayload[] =
    day?.items.map((i) => ({
      placeName: i.placeName,
      startTime: i.startTime,
      transport: i.transport,
    })) ?? [];

  return {
    dateLabel: getKstDateLabel(now),
    tripTitle: trip?.title,
    items,
  };
}
