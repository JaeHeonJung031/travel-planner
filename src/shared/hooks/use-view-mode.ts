"use client";

import { useEffect, useState } from "react";
import type { ViewMode } from "@/shared/lib/view-mode";
import { VIEW_MODE_COOKIE } from "@/shared/lib/view-mode";

function readViewMode(): ViewMode {
  if (typeof document === "undefined") return "desktop";

  const fromHtml = document.documentElement.getAttribute("data-view-mode");
  if (fromHtml === "mobile" || fromHtml === "desktop") return fromHtml;

  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${VIEW_MODE_COOKIE}=(mobile|desktop)`),
  );
  if (match?.[1] === "mobile" || match?.[1] === "desktop") return match[1];

  return "desktop";
}

export function useViewMode(): ViewMode {
  const [mode, setMode] = useState<ViewMode>("desktop");

  useEffect(() => {
    setMode(readViewMode());
  }, []);

  return mode;
}

/** 추후 모바일 전용 주소용 링크 prefix */
export function mobilePath(path: string, mode: ViewMode) {
  if (mode !== "mobile") return path;
  if (path.startsWith("/m")) return path;
  return path === "/" ? "/m" : `/m${path}`;
}
