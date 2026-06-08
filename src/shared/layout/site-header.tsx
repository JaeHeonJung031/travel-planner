"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { APP_NAME } from "@/shared/lib/constants";
import { useViewMode } from "@/shared/hooks/use-view-mode";

const NAV = [
  { href: "/", label: "홈" },
  { href: "/attractions", label: "여행지" },
  { href: "/planner", label: "여행 코스" },
  { href: "/trips", label: "내 일정" },
];

function displayName(name?: string | null, email?: string | null) {
  if (name?.trim()) return name.trim();
  if (email) return email.split("@")[0] ?? "회원";
  return "회원";
}

function HeaderUserMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="h-9 w-28 animate-pulse rounded-full bg-slate-100" aria-hidden />;
  }

  if (!session?.user) {
    return (
      <Link href="/login" className="btn-outline text-sm">
        로그인
      </Link>
    );
  }

  const name = displayName(session.user.name, session.user.email);
  const image = session.user.image;

  return (
    <Link
      href="/profile"
      className="flex max-w-[200px] items-center gap-2.5 rounded-full py-1 pl-1 pr-3 transition hover:bg-slate-50"
      title="내 프로필"
    >
      {image ? (
        <Image
          src={image}
          alt=""
          width={36}
          height={36}
          unoptimized
          className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-slate-100"
        />
      ) : (
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-white"
          aria-hidden
        >
          {name.charAt(0).toUpperCase()}
        </span>
      )}
      <span className="truncate text-sm font-medium text-[#333]">{name}</span>
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const viewMode = useViewMode();
  const isMobile = viewMode === "mobile";

  return (
    <header className="sticky top-0 z-[1000] flex items-center justify-between bg-white px-5 py-5 shadow-[0_2px_5px_rgba(0,0,0,0.05)] md:px-10">
      <Link href="/" className="flex items-center gap-2 text-xl font-bold text-[var(--primary)] md:text-2xl">
        <span aria-hidden>⛩️</span>
        {APP_NAME}
      </Link>

      {!isMobile ? (
        <nav className="view-desktop-only">
          <ul className="flex list-none gap-8">
            {NAV.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`font-medium transition ${
                    pathname === href || (href !== "/" && pathname.startsWith(href))
                      ? "text-[var(--primary)]"
                      : "text-[#555] hover:text-[var(--primary)]"
                  }`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <div className="flex items-center gap-3">
        <HeaderUserMenu />
        {!isMobile ? (
          <Link href="/planner" className="btn-primary hidden px-6 py-2.5 text-sm sm:inline-flex">
            플랜 시작
          </Link>
        ) : null}
      </div>
    </header>
  );
}
