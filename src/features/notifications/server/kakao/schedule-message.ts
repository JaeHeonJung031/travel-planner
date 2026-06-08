export type ScheduleItemPayload = {
  placeName: string;
  startTime?: string | null;
  transport?: string | null;
};

export function formatScheduleMessage(dateLabel: string, items: ScheduleItemPayload[]) {
  if (items.length === 0) {
    return `📅 ${dateLabel} 여행 일정\n\n오늘 등록된 일정이 없습니다.`;
  }

  const lines = items.map((item, i) => {
    const time = item.startTime ? ` ${item.startTime}` : "";
    const transport = item.transport ? ` · ${item.transport}` : "";
    return `${i + 1}. ${item.placeName}${time}${transport}`;
  });

  return [`📅 ${dateLabel} 당일 여행 일정`, "", ...lines].join("\n");
}
