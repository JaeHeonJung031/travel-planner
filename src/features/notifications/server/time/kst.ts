const TZ = "Asia/Seoul";

function kstParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
  };
}

/** 알림 설정 시간과 비교용 (예: "08:00", 한국 시간) */
export function getKstTimeKey(date = new Date()) {
  const { hour, minute } = kstParts(date);
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

export function getKstDateLabel(date = new Date()) {
  const { year, month, day } = kstParts(date);
  return `${year}-${month}-${day}`;
}

/** 당일 TripDay 조회용 (DB DateTime은 UTC로 저장) */
export function getKstDayRange(date = new Date()) {
  const dateLabel = getKstDateLabel(date);
  const dayStart = new Date(`${dateLabel}T00:00:00+09:00`);
  const dayEnd = new Date(`${dateLabel}T23:59:59.999+09:00`);
  return { dayStart, dayEnd, dateLabel };
}
