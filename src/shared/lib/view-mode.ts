export type ViewMode = "desktop" | "mobile";

export const VIEW_MODE_HEADER = "x-view-mode";
export const VIEW_MODE_COOKIE = "view-mode";

/** 추후 모바일 전용 주소: m.example.com 또는 /m/... */
export function isMobileHost(host: string) {
  const hostname = host.split(":")[0].toLowerCase();
  return hostname.startsWith("m.");
}

export function isMobilePath(pathname: string) {
  return pathname === "/m" || pathname.startsWith("/m/");
}
