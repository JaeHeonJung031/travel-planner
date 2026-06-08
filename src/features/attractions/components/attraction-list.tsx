"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/shared/ui/badge";
import { JAPAN_REGIONS, type JapanRegionId } from "@/shared/lib/constants";
import type { AttractionResult } from "@/server/ai/types";
import { AttractionDetailModal } from "@/features/attractions/components/attraction-detail-modal";
import { Clock, Star, Ticket } from "lucide-react";

function AttractionCard({
  attraction,
  onSelect,
}: {
  attraction: AttractionResult;
  onSelect: () => void;
}) {
  const photos =
    attraction.imageUrls?.length
      ? attraction.imageUrls
      : attraction.imageUrl
        ? [attraction.imageUrl]
        : [];

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white text-left shadow-sm transition hover:scale-[1.01] hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
    >
      <div className="relative cursor-zoom-in">
        {photos.length > 0 ? (
          <div className="relative aspect-[4/3] w-full sm:aspect-[16/10]">
            <Image
              src={photos[0]}
              alt={attraction.name}
              fill
              className="object-cover object-center transition duration-300 group-hover:scale-[1.02]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              priority
            />
          </div>
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-rose-100 to-sky-100 text-sm text-slate-500 sm:aspect-[16/10]">
            사진 준비 중
          </div>
        )}

        {photos.length > 1 ? (
          <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            +{photos.length - 1}장 · 탭하여 확대
          </span>
        ) : (
          <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm opacity-0 transition group-hover:opacity-100">
            탭하여 확대
          </span>
        )}

        <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-slate-700 opacity-0 shadow transition group-hover:opacity-100">
          자세히 보기
        </span>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-4 text-white">
          <div className="flex items-end justify-between gap-2">
            <h3 className="text-lg font-bold leading-tight drop-shadow-sm">{attraction.name}</h3>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/20 px-2 py-1 text-sm font-semibold backdrop-blur-sm">
              <Star size={14} className="fill-amber-400 text-amber-400" />
              {attraction.rating}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2 px-3 py-2.5">
        <div className="flex flex-wrap gap-3 text-xs text-slate-600">
          {attraction.fee ? (
            <span className="inline-flex items-center gap-1">
              <Ticket size={13} className="text-rose-500" />
              {attraction.fee}
            </span>
          ) : null}
          {attraction.hours ? (
            <span className="inline-flex items-center gap-1">
              <Clock size={13} className="text-slate-400" />
              {attraction.hours}
            </span>
          ) : null}
        </div>
        {attraction.bestVisitTags?.length ? (
          <div className="flex flex-wrap gap-1">
            {attraction.bestVisitTags.map((tag) => (
              <Badge key={tag}>
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
    </button>
  );
}

export function AttractionList() {
  const searchParams = useSearchParams();
  const regionParam = searchParams.get("region") as JapanRegionId | null;
  const initialRegion =
    regionParam && JAPAN_REGIONS.some((r) => r.id === regionParam)
      ? regionParam
      : "OSAKA_KYOTO";

  const [region, setRegion] = useState<JapanRegionId>(initialRegion);
  const [items, setItems] = useState<AttractionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AttractionResult | null>(null);

  useEffect(() => {
    if (regionParam && JAPAN_REGIONS.some((r) => r.id === regionParam)) {
      setRegion(regionParam);
    }
  }, [regionParam]);

  useEffect(() => {
    setLoading(true);
    setSelected(null);
    fetch(`/api/ai/attractions?region=${region}`)
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .finally(() => setLoading(false));
  }, [region]);

  return (
    <div className="space-y-4">
      <select
        value={region}
        onChange={(e) => setRegion(e.target.value as JapanRegionId)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm"
      >
        {JAPAN_REGIONS.map((r) => (
          <option key={r.id} value={r.id}>
            {r.label}
          </option>
        ))}
      </select>

      {loading ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <li key={n} className="animate-pulse overflow-hidden rounded-2xl border border-slate-100">
              <div className="aspect-[4/3] bg-slate-200 sm:aspect-[16/10]" />
              <div className="space-y-2 p-3">
                <div className="h-3 w-2/3 rounded bg-slate-200" />
                <div className="h-3 w-1/2 rounded bg-slate-100" />
              </div>
            </li>
          ))}
        </ul>
      ) : items.length === 0 ? (
        <p className="py-12 text-center text-sm text-slate-500">이 지역 관광지가 없습니다.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <li key={a.id}>
              <AttractionCard attraction={a} onSelect={() => setSelected(a)} />
            </li>
          ))}
        </ul>
      )}

      <AttractionDetailModal attraction={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
