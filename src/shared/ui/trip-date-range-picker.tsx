"use client";

import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ko } from "date-fns/locale";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import {
  formatTripDuration,
  formatTripRangeDetail,
  formatTripRangeLabel,
  type TripDateRange,
} from "@/shared/lib/trip-dates";

type Props = {
  value: TripDateRange;
  onChange: (range: TripDateRange) => void;
  label?: string;
  minDate?: Date;
  variant?: "hero" | "default";
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function TripDateRangePicker({
  value,
  onChange,
  label = "날짜 선택",
  minDate = startOfDay(new Date()),
  variant = "default",
}: Props) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(parseISO(value.startDate)));
  const [draftStart, setDraftStart] = useState<string | null>(null);

  const start = parseISO(value.startDate);
  const end = parseISO(value.endDate);
  const durationLabel = formatTripDuration(value.startDate, value.endDate);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      setViewMonth(startOfMonth(parseISO(value.startDate)));
      setDraftStart(null);
    }
  }, [open, value.startDate]);

  function isDisabled(day: Date) {
    return isBefore(day, minDate);
  }

  function isInRange(day: Date) {
    if (draftStart) return false;
    if (isBefore(end, start)) return false;
    return (
      (isSameDay(day, start) || isAfter(day, start)) &&
      (isSameDay(day, end) || isBefore(day, end))
    );
  }

  function isRangeEdge(day: Date) {
    if (draftStart) return isSameDay(day, parseISO(draftStart));
    return isSameDay(day, start) || isSameDay(day, end);
  }

  function onDayClick(day: Date) {
    if (isDisabled(day)) return;

    const clicked = format(day, "yyyy-MM-dd");

    if (!draftStart) {
      setDraftStart(clicked);
      return;
    }

    let nextStart = draftStart;
    let nextEnd = clicked;
    if (isBefore(parseISO(clicked), parseISO(draftStart))) {
      nextStart = clicked;
      nextEnd = draftStart;
    }
    if (nextStart === nextEnd) {
      nextEnd = format(addDays(parseISO(nextStart), 1), "yyyy-MM-dd");
    }

    onChange({ startDate: nextStart, endDate: nextEnd });
    setDraftStart(null);
    setOpen(false);
  }

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const triggerClass =
    variant === "hero"
      ? "w-full text-left text-base text-[#333] outline-none"
      : "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm text-slate-800";

  return (
    <div ref={rootRef} className="relative w-full">
      <label htmlFor={id} className={variant === "hero" ? undefined : "mb-1 block text-sm font-medium"}>
        {variant === "hero" ? (
          <span className="mb-1 block text-xs font-bold text-[#888]">{label}</span>
        ) : (
          label
        )}
      </label>
      <button
        id={id}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${triggerClass} flex items-center gap-2`}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Calendar size={variant === "hero" ? 18 : 16} className="shrink-0 text-[var(--primary)]" />
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{durationLabel}</span>
          <span className={variant === "hero" ? "text-xs text-[#888]" : "text-xs text-slate-500"}>
            {formatTripRangeLabel(value.startDate, value.endDate)}
          </span>
        </span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="여행 날짜 선택"
          className={`trip-date-picker-panel z-50 ${
            variant === "hero"
              ? "left-1/2 mt-2 w-[min(100vw-2rem,340px)] -translate-x-1/2 sm:left-0 sm:translate-x-0"
              : "left-0 mt-2 w-full min-w-[300px] sm:w-[340px]"
          } absolute top-full rounded-2xl border border-slate-200 bg-white p-4 shadow-xl`}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setViewMonth((m) => subMonths(m, 1))}
              className="rounded-lg p-1.5 hover:bg-slate-100"
              aria-label="이전 달"
            >
              <ChevronLeft size={20} />
            </button>
            <p className="text-sm font-bold text-slate-800">
              {format(viewMonth, "yyyy년 M월", { locale: ko })}
            </p>
            <button
              type="button"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              className="rounded-lg p-1.5 hover:bg-slate-100"
              aria-label="다음 달"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <p className="mb-3 text-center text-xs text-slate-500">
            {draftStart
              ? "체크아웃 날짜를 선택하세요"
              : "체크인 날짜를 선택하세요"}
          </p>

          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-slate-400">
            {WEEKDAYS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const inMonth = isSameMonth(day, viewMonth);
              const disabled = isDisabled(day);
              const selected = isRangeEdge(day);
              const inRange = isInRange(day) && !selected;

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={disabled}
                  onClick={() => onDayClick(day)}
                  className={[
                    "h-9 rounded-lg text-sm transition",
                    !inMonth && "text-slate-300",
                    disabled && "cursor-not-allowed opacity-30",
                    inRange && "bg-[var(--primary-light)] text-[var(--primary)]",
                    selected && "bg-[var(--primary)] font-bold text-white",
                    !selected && !inRange && !disabled && inMonth && "hover:bg-slate-100",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2.5 text-center">
            <p className="text-sm font-bold text-[var(--primary)]">{durationLabel}</p>
            <p className="mt-0.5 text-xs text-slate-600">
              {draftStart
                ? `${format(parseISO(draftStart), "M.d", { locale: ko })} – 체크아웃 선택`
                : formatTripRangeDetail(value.startDate, value.endDate)}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
