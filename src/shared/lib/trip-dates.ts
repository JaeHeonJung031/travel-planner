import {
  addDays,
  differenceInCalendarDays,
  format,
  parseISO,
  startOfDay,
} from "date-fns";
import { ko } from "date-fns/locale";

export type TripDateRange = {
  startDate: string;
  endDate: string;
};

export function toDateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function defaultTripRange(nights = 6): TripDateRange {
  const start = startOfDay(addDays(new Date(), 14));
  const end = addDays(start, nights);
  return { startDate: toDateString(start), endDate: toDateString(end) };
}

export function tripNightsAndDays(startDate: string, endDate: string) {
  const nights = differenceInCalendarDays(parseISO(endDate), parseISO(startDate));
  return { nights, days: nights + 1 };
}

export function formatTripDuration(startDate: string, endDate: string): string {
  const { nights, days } = tripNightsAndDays(startDate, endDate);
  return `${nights}박 ${days}일`;
}

export function formatTripRangeLabel(startDate: string, endDate: string): string {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  return `${format(start, "M.d", { locale: ko })} – ${format(end, "M.d", { locale: ko })}`;
}

export function formatTripRangeDetail(startDate: string, endDate: string): string {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  return `${format(start, "yyyy.M.d (EEE)", { locale: ko })} – ${format(end, "yyyy.M.d (EEE)", { locale: ko })}`;
}
