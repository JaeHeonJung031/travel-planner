"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Home, MessageCircle, Wallet } from "lucide-react";

const NAV = [
  { href: "/", label: "홈", icon: Home },
  { href: "/planner", label: "일정", icon: Calendar },
  { href: "/chat", label: "상담", icon: MessageCircle },
  { href: "/budget", label: "예산", icon: Wallet },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-lg -translate-x-1/2 border-t border-[var(--border)] bg-white px-2 py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <ul className="grid grid-cols-4 gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex flex-col items-center gap-0.5 rounded-xl py-2 text-xs transition ${
                  active ? "font-medium text-[var(--primary)]" : "text-[var(--muted)]"
                }`}
              >
                <Icon size={20} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
