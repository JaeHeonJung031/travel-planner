import Image from "next/image";
import { format } from "date-fns";
import { Clock, MapPin } from "lucide-react";
import type { JapanRegionId } from "@/shared/lib/constants";
import { getTripCoverImage, getTripGalleryImages, resolvePlaceImage } from "@/features/trips/server/trip-images";

export type TripDayData = {
  id: string;
  dayIndex: number;
  date: Date;
  items: {
    id: string;
    placeName: string;
    startTime: string | null;
    endTime: string | null;
    transport: string | null;
  }[];
};

type TripItineraryGalleryProps = {
  title: string;
  region: JapanRegionId;
  regionLabel?: string;
  startDate: Date;
  endDate: Date;
  days: TripDayData[];
  headerExtra?: React.ReactNode;
};

export function TripItineraryGallery({
  title,
  region,
  regionLabel,
  startDate,
  endDate,
  days,
  headerExtra,
}: TripItineraryGalleryProps) {
  const trip = { region, days };
  const hero = getTripCoverImage(trip);
  const mosaic = getTripGalleryImages(trip, 5);

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="relative aspect-[16/9] w-full sm:aspect-[21/9]">
          <Image src={hero} alt={title} fill className="object-cover" sizes="100vw" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
          <div className="absolute bottom-0 left-0 right-0 p-5 text-white sm:p-6">
            {regionLabel ? (
              <p className="text-xs font-semibold uppercase tracking-wider text-white/75">{regionLabel}</p>
            ) : null}
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{title}</h1>
            <p className="mt-2 text-sm text-white/90">
              {format(startDate, "yyyy.MM.dd")} – {format(endDate, "yyyy.MM.dd")} · {days.length}일
            </p>
          </div>
        </div>

        {mosaic.length > 1 ? (
          <div className="grid grid-cols-4 gap-0.5 bg-slate-100 p-0.5">
            {mosaic.slice(0, 4).map((src, i) => (
              <div
                key={src}
                className={`relative overflow-hidden ${i === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-square"}`}
              >
                <Image src={src} alt="" fill className="object-cover" sizes="(max-width:768px) 25vw, 15vw" />
              </div>
            ))}
          </div>
        ) : null}

        {headerExtra ? <div className="border-t border-slate-100 p-4">{headerExtra}</div> : null}
      </section>

      {days.map((day) => (
        <section key={day.id}>
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h2 className="text-lg font-bold text-slate-900">{day.dayIndex + 1}일차</h2>
            <span className="text-sm text-slate-500">{format(day.date, "M월 d일")}</span>
          </div>

          <div className="-mx-1 flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {day.items.length === 0 ? (
              <p className="px-1 text-sm text-slate-500">등록된 장소가 없습니다.</p>
            ) : (
              day.items.map((item) => {
                const photo = resolvePlaceImage(item.placeName, region);
                return (
                  <article
                    key={item.id}
                    className="w-[min(72vw,220px)] shrink-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
                  >
                    <div className="relative aspect-[3/4] w-full">
                      <Image
                        src={photo}
                        alt={item.placeName}
                        fill
                        className="object-cover"
                        sizes="220px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                        <p className="line-clamp-2 text-sm font-semibold leading-snug">{item.placeName}</p>
                        {item.startTime ? (
                          <p className="mt-1 flex items-center gap-1 text-xs text-white/85">
                            <Clock size={12} />
                            {item.startTime}
                            {item.endTime ? ` – ${item.endTime}` : ""}
                          </p>
                        ) : null}
                        {item.transport ? (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-white/75">
                            <MapPin size={12} />
                            {item.transport}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
