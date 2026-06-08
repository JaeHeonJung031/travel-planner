import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/server/db/prisma";
import { suggestAllocationsFromTrip } from "@/features/budget/server/trip-budget-suggest";

const DEFAULT_RATIOS = [
  { category: "ACCOMMODATION", ratio: 0.35 },
  { category: "TRANSPORT", ratio: 0.2 },
  { category: "FOOD", ratio: 0.25 },
  { category: "SIGHTSEEING", ratio: 0.15 },
  { category: "OTHER", ratio: 0.05 },
] as const;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { totalKrw, tripId } = await req.json();
  const total = Number(totalKrw) || 0;

  if (tripId) {
    const trip = await prisma.trip.findFirst({
      where: { id: tripId, userId: session.user.id },
      include: {
        days: {
          orderBy: { dayIndex: "asc" },
          include: {
            items: {
              select: { placeName: true, transport: true, notes: true },
            },
          },
        },
      },
    });

    if (!trip) {
      return NextResponse.json({ error: "여행을 찾을 수 없습니다." }, { status: 404 });
    }

    const suggestedTotal = trip.totalBudget && trip.totalBudget > 0 ? trip.totalBudget : total;
    const allocations = suggestAllocationsFromTrip(
      {
        region: trip.region,
        totalBudget: trip.totalBudget,
        days: trip.days,
      },
      suggestedTotal,
    );

    return NextResponse.json({
      source: "trip",
      totalKrw: suggestedTotal,
      allocations,
      hint: `${trip.days.length}일 일정·${trip.days.reduce((n, d) => n + d.items.length, 0)}개 장소를 반영했습니다.`,
    });
  }

  const allocations = DEFAULT_RATIOS.map((r) => ({
    category: r.category,
    amountKrw: Math.round(total * r.ratio),
  }));

  return NextResponse.json({ source: "default", totalKrw: total, allocations });
}
