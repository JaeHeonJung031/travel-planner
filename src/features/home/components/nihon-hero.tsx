"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TripDateRangePicker } from "@/shared/ui/trip-date-range-picker";
import { JAPAN_REGIONS } from "@/shared/lib/constants";
import { defaultTripRange, type TripDateRange } from "@/shared/lib/trip-dates";

export function NihonHero() {
  const router = useRouter();
  const [region, setRegion] = useState("TOKYO");
  const [dateRange, setDateRange] = useState<TripDateRange>(() => defaultTripRange());
  const [guests, setGuests] = useState(1);

  function startPlan() {
    const params = new URLSearchParams({
      region,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      guests: String(guests),
    });
    router.push(`/planner?${params.toString()}`);
  }

  return (
    <section className="nihon-hero">
      <h1 className="mb-4 text-3xl font-bold md:text-[42px]">당신의 완벽한 일본 여행을 계획하세요!</h1>
      <p className="mb-8 text-base opacity-90 md:text-lg">
        도쿄, 교토, 오사카.. 나만의 맞춤형 여행 일정 만들기
      </p>

      <div className="nihon-search-bar">
        <div className="nihon-search-item">
          <label htmlFor="hero-region">여행지</label>
          <select
            id="hero-region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            {JAPAN_REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div className="nihon-search-item nihon-search-item--dates">
          <TripDateRangePicker
            variant="hero"
            label="날짜 선택"
            value={dateRange}
            onChange={setDateRange}
          />
        </div>
        <div className="nihon-search-item">
          <label htmlFor="hero-guests">인원</label>
          <input
            id="hero-guests"
            type="number"
            min={1}
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
          />
        </div>
        <button type="button" onClick={startPlan} className="btn-primary w-full px-8 py-3 sm:w-auto">
          플랜 시작
        </button>
      </div>
    </section>
  );
}
