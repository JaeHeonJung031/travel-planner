import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { formatScheduleMessage } from "@/features/notifications/server/kakao/schedule-message";
import { getTodayScheduleForUser } from "@/features/notifications/server/today-schedule";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const schedule = await getTodayScheduleForUser(session.user.id);
  const text = formatScheduleMessage(schedule.dateLabel, schedule.items);

  return NextResponse.json({ ...schedule, preview: text });
}
