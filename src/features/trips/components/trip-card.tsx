import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import type { JapanRegionId } from "@/shared/lib/constants";
import { getTripCoverImage, getTripGalleryImages } from "@/features/trips/server/trip-images";

type TripCardProps = {
  id: string;
  title: string;
  region: JapanRegionId;
  regionLabel: string;
  startDate: Date;
  endDate: Date;
  days: { items: { placeName: string }[] }[];
};

export function TripCard({ id, title, region, regionLabel, startDate, endDate, days }: TripCardProps) {
  const trip = { region, days };
  const cover = getTripCoverImage(trip);
  const thumbs = getTripGalleryImages(trip, 4).filter((u) => u !== cover).slice(0, 3);

  return (
    <Link href={`/trips/${id}`} className="group block overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:shadow-lg">
      <div className="relative aspect-[4/3] w-full sm:aspect-[16/10]">
        <Image
          src={cover}
          alt={title}
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <p className="text-xs font-medium uppercase tracking-wide text-white/80">{regionLabel}</p>
          <h3 className="mt-0.5 text-lg font-bold leading-tight">{title}</h3>
          <p className="mt-1 text-sm text-white/90">
            {format(startDate, "yyyy.MM.dd")} – {format(endDate, "yyyy.MM.dd")}
          </p>
        </div>
        {thumbs.length > 0 ? (
          <div className="absolute right-3 top-3 flex gap-1">
            {thumbs.map((src) => (
              <div key={src} className="relative h-10 w-10 overflow-hidden rounded-lg ring-2 ring-white/90">
                <Image src={src} alt="" fill className="object-cover" sizes="40px" />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
