import { headers } from "next/headers";
import type { ViewMode } from "./view-mode";
import { VIEW_MODE_HEADER } from "./view-mode";

export async function getViewMode(): Promise<ViewMode> {
  const h = await headers();
  const mode = h.get(VIEW_MODE_HEADER);
  if (mode === "mobile" || mode === "desktop") return mode;
  return "desktop";
}
