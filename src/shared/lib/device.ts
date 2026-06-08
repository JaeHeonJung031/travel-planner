const MOBILE_UA_RE =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i;

export function isMobileUserAgent(userAgent: string | null | undefined) {
  if (!userAgent) return false;
  return MOBILE_UA_RE.test(userAgent);
}
