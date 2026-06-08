"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Calendar,
  FolderOpen,
  Hotel,
  ListChecks,
  MapPin,
  MessageCircle,
  Utensils,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { SHORTCUT_GROUPS } from "@/shared/lib/shortcut-groups";

const ICONS: Record<string, LucideIcon> = {
  "/checklist": ListChecks,
  "/chat": MessageCircle,
  "/planner": Calendar,
  "/trips": FolderOpen,
  "/budget": Wallet,
  "/restaurants": Utensils,
  "/attractions": MapPin,
  "/stays": Hotel,
  "/settings/notifications": Bell,
};

function NavLink({ href, title, desc }: { href: string; title: string; desc: string }) {
  const pathname = usePathname();
  const Icon = ICONS[href] ?? MapPin;
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`group flex items-start gap-3 rounded-lg px-3 py-2.5 transition ${
        active ? "bg-[var(--primary-light)] ring-1 ring-[var(--primary)]/30" : "hover:bg-[#f1f3f5]"
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          active ? "bg-white text-[var(--primary)]" : "bg-[#f1f3f5] text-[#888]"
        }`}
      >
        <Icon size={18} />
      </span>
      <span className="min-w-0 pt-0.5">
        <span
          className={`block text-sm font-medium ${active ? "text-[var(--primary)]" : "text-[#333]"}`}
        >
          {title}
        </span>
        <span className="mt-1 block text-[11px] leading-snug text-[var(--muted)]">{desc}</span>
      </span>
    </Link>
  );
}

export function ShortcutsSidebar({ className = "" }: { className?: string }) {
  return (
    <aside className={`shortcuts-sidebar view-desktop-only w-56 shrink-0 xl:w-60 ${className}`}>
      <nav className="shortcuts-nav-panel rounded-xl bg-white p-4 shadow-[0_4px_15px_rgba(0,0,0,0.05)]">
        <h2 className="mb-1 text-lg font-bold">바로가기</h2>
        <p className="mb-4 text-xs text-[var(--muted)]">자주 쓰는 기능</p>
        <div className="space-y-4">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#888]">
                {group.label}
              </p>
              <ul className="space-y-1">
                {group.items.map((f) => (
                  <li key={f.href}>
                    <NavLink href={f.href} title={f.title} desc={f.desc} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>
    </aside>
  );
}
