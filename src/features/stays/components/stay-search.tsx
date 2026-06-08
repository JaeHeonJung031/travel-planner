"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { JAPAN_REGIONS, type JapanRegionId } from "@/shared/lib/constants";
import type { AccommodationResult } from "@/server/ai/types";

const STAY_TYPE_LABELS: Record<string, string> = {
  HOTEL: "호텔",
  RYOKAN: "료칸",
  GUESTHOUSE: "게스트하우스",
};

export function StaySearch() {
  const [region, setRegion] = useState<JapanRegionId>("TOKYO");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [budgetKrw, setBudgetKrw] = useState(150000);
  const [types, setTypes] = useState<string[]>(["HOTEL", "RYOKAN", "GUESTHOUSE"]);
  const [items, setItems] = useState<AccommodationResult[]>([]);

  async function search() {
    const q = new URLSearchParams({
      region,
      checkIn,
      checkOut,
      guests: String(guests),
      budgetKrw: String(budgetKrw),
      types: types.join(","),
    });
    const res = await fetch(`/api/ai/accommodations?${q}`);
    const data = await res.json();
    setItems(data.items ?? []);
  }

  function toggleType(t: string) {
    setTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value as JapanRegionId)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        >
          {JAPAN_REGIONS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="rounded-xl border px-3 py-2 text-sm" />
          <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="rounded-xl border px-3 py-2 text-sm" />
        </div>
        <input type="number" value={guests} onChange={(e) => setGuests(Number(e.target.value))} className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="인원" />
        <input type="number" value={budgetKrw} onChange={(e) => setBudgetKrw(Number(e.target.value))} className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="1박 예산(원)" />
        <div className="flex flex-wrap gap-2">
          {["HOTEL", "RYOKAN", "GUESTHOUSE"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggleType(t)}
              className={`rounded-full px-3 py-1 text-xs ${types.includes(t) ? "bg-rose-600 text-white" : "bg-slate-100"}`}
            >
              {t === "HOTEL" ? "호텔" : t === "RYOKAN" ? "료칸" : "게스트하우스"}
            </button>
          ))}
        </div>
        <Button type="button" className="w-full" onClick={search}>
          숙소 검색
        </Button>
      </Card>

      <ul className="space-y-3">
        {items.map((s) => (
          <li key={s.id}>
            <Card>
              <div className="flex justify-between">
                <div>
                  <h3 className="font-semibold">{s.name}</h3>
                  <p className="text-sm text-slate-500">
                    {STAY_TYPE_LABELS[s.type] ?? s.type} · ★ {s.rating}
                  </p>
                </div>
                <p className="font-semibold text-rose-600">{s.priceKrw.toLocaleString()}원</p>
              </div>
              <a href={s.bookingUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-sky-600 underline">
                예약 링크
              </a>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
