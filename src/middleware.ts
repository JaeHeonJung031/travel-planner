import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { resolveViewMode } from "@/shared/lib/resolve-view-mode";
import { isMobilePath, VIEW_MODE_COOKIE, VIEW_MODE_HEADER } from "@/shared/lib/view-mode";

const { auth } = NextAuth(authConfig);

const protectedPrefixes = [
  "/checklist",
  "/chat",
  "/planner",
  "/trips",
  "/budget",
  "/profile",
  "/settings",
  "/restaurants",
  "/attractions",
  "/stays",
];

const guestOnlyPaths = new Set(["/login", "/register", "/forgot-password"]);

function normalizePath(pathname: string) {
  return pathname.startsWith("/m") ? pathname.replace(/^\/m/, "") || "/" : pathname;
}

function safeCallbackUrl(raw: string | null) {
  if (raw?.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/";
}

function applyViewMode(response: NextResponse, mode: "desktop" | "mobile") {
  response.headers.set(VIEW_MODE_HEADER, mode);
  response.cookies.set(VIEW_MODE_COOKIE, mode, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
  });
  return response;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const viewMode = resolveViewMode(req);
  const path = normalizePath(pathname);

  if (req.auth && guestOnlyPaths.has(path)) {
    const destination = safeCallbackUrl(req.nextUrl.searchParams.get("callbackUrl"));
    const redirect = NextResponse.redirect(new URL(destination, req.nextUrl.origin));
    return applyViewMode(redirect, viewMode);
  }

  let response: NextResponse;

  if (isMobilePath(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.replace(/^\/m/, "") || "/";
    response = NextResponse.rewrite(url);
  } else {
    response = NextResponse.next();
  }

  applyViewMode(response, viewMode);

  const isProtected = protectedPrefixes.some((p) => path.startsWith(p));

  if (isProtected && !req.auth) {
    const loginUrl = new URL(viewMode === "mobile" ? "/m/login" : "/login", req.nextUrl.origin);
    const callbackPath = isMobilePath(pathname)
      ? pathname.replace(/^\/m/, "") || "/"
      : pathname;
    loginUrl.searchParams.set("callbackUrl", callbackPath);
    const redirect = NextResponse.redirect(loginUrl);
    return applyViewMode(redirect, viewMode);
  }

  return response;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|share).*)"],
};
