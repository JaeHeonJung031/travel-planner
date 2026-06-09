// src/features/planner/components/planner-panel.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { TripDateRangePicker } from "@/shared/ui/trip-date-range-picker";
import { JAPAN_REGIONS, type JapanRegionId } from "@/shared/lib/constants";
import { defaultTripRange, type TripDateRange } from "@/shared/lib/trip-dates";
import type { ItineraryDay } from "@/server/ai/types";

const THEME_OPTIONS = [
  { value: "sightseeing", label: "🏯 관광명소" },
  { value: "food",        label: "🍜 맛집/음식" },
  { value: "healing",     label: "♨️ 힐링/온천" },
  { value: "shopping",    label: "🛍 쇼핑" },
  { value: "culture",     label: "⛩ 문화/역사" },
  { value: "otaku",       label: "🎌 덕질/애니" },
] as const;

type Theme = (typeof THEME_OPTIONS)[number]["value"];

function SortableItem({
  id,
  label,
  time,
  notes,
}: {
  id: string;
  label: string;
  time?: string;
  notes?: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <li ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="mb-2 cursor-grab !py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">📍 {label}</span>
          {time && (
            <span className="text-xs text-rose-600 font-medium whitespace-nowrap ml-2">
              {time}
            </span>
          )}
        </div>
        {notes && (
          <p className="mt-1 text-xs text-slate-500 line-clamp-2">{notes}</p>
        )}
      </Card>
    </li>
  );
}

export function PlannerPanel() {
  const searchParams = useSearchParams();
  const [region, setRegion] = useState<JapanRegionId>("OSAKA_KYOTO");
  const [origin, setOrigin] = useState("인천공항");
  const [dateRange, setDateRange] = useState<TripDateRange>(() => defaultTripRange());
  const [travelers, setTravelers] = useState(2);
  const [budgetKrw, setBudgetKrw] = useState(1500000);
  const [preferences, setPreferences] = useState<Theme[]>(["sightseeing", "food"]);
  const [days, setDays] = useState<ItineraryDay[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const regionParam = searchParams.get("region");
    const start = searchParams.get("startDate");
    const end = searchParams.get("endDate");
    const guests = searchParams.get("guests");

    if (regionParam && JAPAN_REGIONS.some((r) => r.id === regionParam)) {
      setRegion(regionParam as JapanRegionId);
    }
    if (start && end) setDateRange({ startDate: start, endDate: end });
    if (guests) {
      const n = Number(guests);
      if (n >= 1) setTravelers(n);
    }
  }, [searchParams]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function togglePreference(theme: Theme) {
    setPreferences((prev) =>
      prev.includes(theme) ? prev.filter((t) => t !== theme) : [...prev, theme]
    );
  }

  async function generate() {
    setLoading(true);
    setError("");
    setDays([]);
    setTitle("");
    try {
      const res = await fetch("/api/ai/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          region,
          origin,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          budgetKrw,
          travelers,
          preferences,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "일정 생성 실패");
      setTitle(data.title ?? "");
      setDays(data.days ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "일정 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function onDragEnd(dayIndex: number, event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    setDays((prev) =>
      prev.map((day, idx) => {
        if (idx !== dayIndex) return day;
        const oldIndex = day.items.findIndex(
          (_, i) => `${dayIndex}-${i}` === active.id
        );
        const newIndex = day.items.findIndex(
          (_, i) => `${dayIndex}-${i}` === over.id
        );
        return { ...day, items: arrayMove(day.items, oldIndex, newIndex) };
      })
    );
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <label className="block text-sm font-medium">지역</label>
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

        <input
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          placeholder="출발지 (예: 인천공항)"
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />

        <TripDateRangePicker value={dateRange} onChange={setDateRange} label="여행 기간" />

        <label className="block text-sm font-medium">인원</label>
        <input
          type="number"
          min={1}
          value={travelers}
          onChange={(e) => setTravelers(Number(e.target.value))}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />

        <input
          type="number"
          value={budgetKrw}
          onChange={(e) => setBudgetKrw(Number(e.target.value))}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder="예산 (원)"
        />

        <div>
          <label className="block text-sm font-medium mb-2">여행 취향 (복수 선택)</label>
          <div className="flex flex-wrap gap-2">
            {THEME_OPTIONS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => togglePreference(t.value)}
                className={`rounded-full px-3 py-1 text-xs transition border ${
                  preferences.includes(t.value)
                    ? "bg-rose-500 text-white border-rose-500"
                    : "bg-white text-slate-600 border-slate-200 hover:border-rose-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <Button
          type="button"
          className="w-full"
          onClick={generate}
          disabled={loading}
        >
          {loading ? "AI 일정 생성 중... ✨" : "AI 일정 생성"}
        </Button>

        {error && <p className="text-xs text-red-500">{error}</p>}
      </Card>

      {title && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
          <p className="text-sm font-bold text-rose-700">🗾 {title}</p>
        </div>
      )}

      {days.map((day, dayIndex) => (
        <Card key={day.dayIndex}>
          <h3 className="mb-3 font-semibold">
            <span className="inline-flex items-center gap-2">
              <span className="rounded-full bg-rose-500 text-white text-xs px-2 py-0.5">
                Day {day.dayIndex}
              </span>
              <span className="text-slate-700">{day.date}</span>
            </span>
          </h3>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(e) => onDragEnd(dayIndex, e)}
          >
            <SortableContext
              items={day.items.map((_, i) => `${dayIndex}-${i}`)}
              strategy={verticalListSortingStrategy}
            >
              <ul>
                {day.items.map((item, i) => (
                  <SortableItem
                    key={`${dayIndex}-${i}`}
                    id={`${dayIndex}-${i}`}
                    label={item.placeName}
                    time={item.startTime}
                    notes={(item as any).notes}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </Card>
      ))}
    </div>
  );
}
