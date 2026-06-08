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

function SortableItem({ id, label, time }: { id: string; label: string; time?: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <li ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="mb-2 flex cursor-grab items-center justify-between !py-3">
        <span className="text-sm font-medium">{label}</span>
        {time ? <span className="text-xs text-slate-500">{time}</span> : null}
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
  const [days, setDays] = useState<ItineraryDay[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const regionParam = searchParams.get("region");
    const start = searchParams.get("startDate");
    const end = searchParams.get("endDate");
    const guests = searchParams.get("guests");

    if (regionParam && JAPAN_REGIONS.some((r) => r.id === regionParam)) {
      setRegion(regionParam as JapanRegionId);
    }
    if (start && end) {
      setDateRange({ startDate: start, endDate: end });
    }
    if (guests) {
      const n = Number(guests);
      if (n >= 1) setTravelers(n);
    }
  }, [searchParams]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function generate() {
    setLoading(true);
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
      }),
    });
    const data = await res.json();
    setDays(data.days ?? []);
    setLoading(false);
  }

  function onDragEnd(dayIndex: number, event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setDays((prev) =>
      prev.map((day, idx) => {
        if (idx !== dayIndex) return day;
        const oldIndex = day.items.findIndex((_, i) => `${dayIndex}-${i}` === active.id);
        const newIndex = day.items.findIndex((_, i) => `${dayIndex}-${i}` === over.id);
        return { ...day, items: arrayMove(day.items, oldIndex, newIndex) };
      }),
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
          placeholder="출발지"
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
        <Button type="button" className="w-full" onClick={generate} disabled={loading}>
          {loading ? "일정 생성 중..." : "AI 일정 생성"}
        </Button>
      </Card>

      {days.map((day, dayIndex) => (
        <Card key={day.dayIndex}>
          <h3 className="mb-2 font-semibold">
            {day.dayIndex}일차 · {day.date}
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
