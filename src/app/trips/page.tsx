import Link from "next/link";
import { AppShell } from "@/shared/layout/app-shell";
import { Card } from "@/shared/ui/card";
import { auth } from "@/auth";
import { prisma } from "@/server/db/prisma";
import { JAPAN_REGIONS } from "@/shared/lib/constants";
import { TripCard } from "@/features/trips/components/trip-card";

export const dynamic = "force-dynamic";

export default async function TripsPage() {
  const session = await auth();
  const trips = session?.user?.id
    ? await prisma.trip.findMany({
        where: { userId: session.user.id },
        orderBy: { updatedAt: "desc" },
        include: {
          days: {
            include: { items: { select: { placeName: true } } },
            orderBy: { dayIndex: "asc" },
          },
        },
      })
    : [];

  return (
    <AppShell title="내 일정">
      <p className="mb-4 text-center text-sm text-slate-500">저장된 여행을 사진으로 한눈에 확인하세요</p>
      <Link
        href="/planner"
        className="mb-6 block rounded-xl border border-dashed border-rose-200 bg-rose-50/50 py-3 text-center text-sm font-medium text-rose-600 transition hover:bg-rose-50"
      >
        + 새 일정 만들기
      </Link>
      {trips.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">저장된 일정이 없습니다. 플래너에서 일정을 생성해 보세요.</p>
        </Card>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {trips.map((trip) => {
            const region = JAPAN_REGIONS.find((r) => r.id === trip.region);
            return (
              <li key={trip.id}>
                <TripCard
                  id={trip.id}
                  title={trip.title}
                  region={trip.region}
                  regionLabel={region?.label ?? trip.region}
                  startDate={trip.startDate}
                  endDate={trip.endDate}
                  days={trip.days}
                />
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
