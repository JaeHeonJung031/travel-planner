import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/server/db/prisma";
import { JAPAN_REGIONS, APP_NAME } from "@/shared/lib/constants";
import { TripItineraryGallery } from "@/features/trips/components/trip-itinerary-gallery";
import { getTripCoverImage } from "@/features/trips/server/trip-images";

export const dynamic = "force-dynamic";

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const trip = await prisma.trip.findUnique({
    where: { shareToken: token },
    include: { days: { include: { items: true }, orderBy: { dayIndex: "asc" } } },
  });

  if (!trip) notFound();

  const region = JAPAN_REGIONS.find((r) => r.id === trip.region);
  const hero = getTripCoverImage({ region: trip.region, days: trip.days });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="relative h-28 overflow-hidden sm:h-36">
        <Image src={hero} alt="" fill className="object-cover" sizes="100vw" priority />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative flex h-full flex-col justify-end px-4 pb-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/80">{APP_NAME}</p>
          <p className="text-lg font-bold text-white">공유된 여행 일정</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <TripItineraryGallery
          title={trip.title}
          region={trip.region}
          regionLabel={region?.label}
          startDate={trip.startDate}
          endDate={trip.endDate}
          days={trip.days}
        />
      </main>
    </div>
  );
}
