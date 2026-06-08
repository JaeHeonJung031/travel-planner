import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/server/db/prisma";
import { JAPAN_REGIONS } from "@/shared/lib/constants";
import { getTripCoverImage, getTripGalleryImages } from "@/features/trips/server/trip-images";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const trips = await prisma.trip.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      days: {
        orderBy: { dayIndex: "asc" },
        include: { items: { select: { placeName: true } } },
      },
    },
  });

  return NextResponse.json({
    trips: trips.map((trip) => {
      const region = JAPAN_REGIONS.find((r) => r.id === trip.region);
      const tripLike = { region: trip.region, days: trip.days };
      const coverImage = getTripCoverImage(tripLike);
      const galleryImages = getTripGalleryImages(tripLike, 4);

      return {
        id: trip.id,
        title: trip.title,
        region: trip.region,
        regionLabel: region?.label ?? trip.region,
        startDate: trip.startDate.toISOString(),
        endDate: trip.endDate.toISOString(),
        totalBudget: trip.totalBudget,
        dayCount: trip.days.length,
        itemCount: trip.days.reduce((n, d) => n + d.items.length, 0),
        coverImage,
        galleryImages,
      };
    }),
  });
}
