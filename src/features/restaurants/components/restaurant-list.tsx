"use client";

import { useEffect, useState } from "react";
import { Card } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { JAPAN_REGIONS, type JapanRegionId } from "@/shared/lib/constants";
import type { RestaurantResult } from "@/server/ai/types";
import { Clock, MapPin, Star } from "lucide-react";

export function RestaurantList() {
  const [region, setRegion] = useState<JapanRegionId>("TOKYO");
  const [items, setItems] = useState<RestaurantResult[]>([]);
  const [maxBudget, setMaxBudget] = useState(30000);
  const [maxDistance, setMaxDistance] = useState(2);
  const [minRating, setMinRating] = useState(4);

  useEffect(() => {
    const q = new URLSearchParams({
      region,
      maxBudgetKrw: String(maxBudget),
      maxDistanceKm: String(maxDistance),
      minRating: String(minRating),
    });
    fetch(`/api/ai/restaurants?${q}`)
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []));
  }, [region, maxBudget, maxDistance, minRating]);

  return (
    <div className="space-y-4">
      <Card className="grid gap-2">
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value as JapanRegionId)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        >
          {JAPAN_REGIONS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
        <label className="text-xs text-slate-500">최대 예산 {maxBudget.toLocaleString()}원</label>
        <input type="range" min={10000} max={100000} step={5000} value={maxBudget} onChange={(e) => setMaxBudget(Number(e.target.value))} />
        <label className="text-xs text-slate-500">거리 {maxDistance}km 이내</label>
        <input type="range" min={0.5} max={5} step={0.5} value={maxDistance} onChange={(e) => setMaxDistance(Number(e.target.value))} />
        <label className="text-xs text-slate-500">최소 평점 {minRating}</label>
        <input type="range" min={3} max={5} step={0.1} value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} />
      </Card>

      <ul className="space-y-3">
        {items.map((r) => (
          <li key={r.id}>
            <Card>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{r.name}</h3>
                  <p className="text-sm text-slate-500">{r.cuisine}</p>
                </div>
                <Badge tone={r.reservationRequired ? "warning" : "success"}>
                  {r.reservationRequired ? "예약 필요" : "워크인 가능"}
                </Badge>
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <Star size={14} className="text-amber-500" /> {r.rating}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin size={14} /> {r.distanceKm}km
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock size={14} /> {r.hours}
                </span>
              </div>
              <p className="mt-1 text-sm font-medium text-rose-600">약 {r.avgPriceKrw.toLocaleString()}원</p>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
