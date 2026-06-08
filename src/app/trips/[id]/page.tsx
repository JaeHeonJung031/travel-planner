import { notFound } from "next/navigation";
import { AppShell } from "@/shared/layout/app-shell";
import { auth } from "@/auth";
import { prisma } from "@/server/db/prisma";
import { JAPAN_REGIONS } from "@/shared/lib/constants";
import { TripActions } from "@/features/trips/components/trip-actions";
import { TripItineraryGallery } from "@/features/trips/components/trip-itinerary-gallery";

export const dynamic = "force-dynamic";

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const trip = await prisma.trip.findFirst({
    where: {
      id,
      OR: [
        { userId: session?.user?.id },
        { collaborators: { some: { userId: session?.user?.id } } },
      ],
    },
    include: { days: { include: { items: true }, orderBy: { dayIndex: "asc" } } },
  });

  if (!trip) notFound();

  const region = JAPAN_REGIONS.find((r) => r.id === trip.region);

  return (
    <AppShell>
      <TripItineraryGallery
        title={trip.title}
        region={trip.region}
        regionLabel={region?.label}
        startDate={trip.startDate}
        endDate={trip.endDate}
        days={trip.days}
        headerExtra={<TripActions tripId={trip.id} shareToken={trip.shareToken} />}
      />
    </AppShell>
  );
}
