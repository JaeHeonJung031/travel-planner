"use client";

import Image from "next/image";
import { format } from "date-fns";

export type TripBudgetOption = {
  id: string;
  title: string;
  regionLabel: string;
  startDate: string;
  endDate: string;
  totalBudget: number | null;
  dayCount: number;
  itemCount: number;
  coverImage: string;
  galleryImages: string[];
};

type Props = {
  trips: TripBudgetOption[];
  selectedId: string | null;
  onSelect: (tripId: string) => void;
};

export function TripBudgetPicker({ trips, selectedId, onSelect }: Props) {
  if (trips.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center">
        <p className="text-sm font-medium text-slate-600">저장된 일정이 없습니다</p>
        <p className="mt-1 text-xs text-slate-500">내 일정에서 여행을 저장한 뒤 예산을 연결할 수 있어요.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 text-sm font-medium text-slate-700">내 일정에서 여행 선택</p>
      <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {trips.map((trip) => {
          const selected = trip.id === selectedId;
          const thumbs = trip.galleryImages.filter((u) => u !== trip.coverImage).slice(0, 2);

          return (
            <button
              key={trip.id}
              type="button"
              onClick={() => onSelect(trip.id)}
              className={`group relative w-[min(100%,280px)] shrink-0 overflow-hidden rounded-2xl border-2 text-left transition ${
                selected
                  ? "border-rose-500 shadow-md ring-2 ring-rose-200"
                  : "border-slate-200/80 hover:border-rose-200 hover:shadow-sm"
              }`}
            >
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={trip.coverImage}
                  alt={trip.title}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  sizes="280px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                {selected ? (
                  <span className="absolute left-3 top-3 rounded-full bg-rose-500 px-2.5 py-0.5 text-xs font-semibold text-white shadow">
                    선택됨
                  </span>
                ) : null}
                {thumbs.length > 0 ? (
                  <div className="absolute right-3 top-3 flex gap-1">
                    {thumbs.map((src) => (
                      <div key={src} className="relative h-9 w-9 overflow-hidden rounded-lg ring-2 ring-white/90">
                        <Image src={src} alt="" fill className="object-cover" sizes="36px" />
                      </div>
                    ))}
                  </div>
                ) : null}
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-white/75">{trip.regionLabel}</p>
                  <p className="mt-0.5 line-clamp-2 text-sm font-bold leading-snug">{trip.title}</p>
                  <p className="mt-1 text-[11px] text-white/85">
                    {format(new Date(trip.startDate), "MM.dd")} – {format(new Date(trip.endDate), "MM.dd")}
                    {" · "}
                    {trip.dayCount}일 · {trip.itemCount}곳
                  </p>
                  {trip.totalBudget ? (
                    <p className="mt-1 text-xs font-medium text-rose-200">
                      일정 예산 {trip.totalBudget.toLocaleString()}원
                    </p>
                  ) : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
