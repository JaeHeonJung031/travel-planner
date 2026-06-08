import { FEATURES } from "./constants";

export const SHORTCUT_GROUPS = [
  {
    label: "여행 준비",
    items: FEATURES.filter((f) => ["/checklist", "/budget"].includes(f.href)),
  },
  {
    label: "일정 · AI",
    items: FEATURES.filter((f) =>
      ["/planner", "/trips", "/chat"].includes(f.href),
    ),
  },
  {
    label: "탐색",
    items: FEATURES.filter((f) =>
      ["/restaurants", "/attractions", "/stays"].includes(f.href),
    ),
  },
  {
    label: "알림",
    items: FEATURES.filter((f) => f.href === "/settings/notifications"),
  },
] as const;
