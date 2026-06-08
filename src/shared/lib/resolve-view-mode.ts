import type { NextRequest } from "next/server";
import { isMobileUserAgent } from "./device";
import {
  isMobileHost,
  isMobilePath,
  VIEW_MODE_COOKIE,
  type ViewMode,
} from "./view-mode";

export function resolveViewMode(req: NextRequest): ViewMode {
  const host = req.headers.get("host") ?? "";
  const ua = req.headers.get("user-agent");

  if (isMobileHost(host) || isMobilePath(req.nextUrl.pathname)) {
    return "mobile";
  }

  const forced = req.nextUrl.searchParams.get("view");
  if (forced === "mobile" || forced === "desktop") return forced;

  const cookie = req.cookies.get(VIEW_MODE_COOKIE)?.value;
  if (cookie === "mobile" || cookie === "desktop") return cookie;

  return isMobileUserAgent(ua) ? "mobile" : "desktop";
}
