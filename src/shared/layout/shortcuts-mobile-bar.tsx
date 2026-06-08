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
import { FEATURES } from "@/shared/lib/constants";

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

const MOBILE_LABELS: Record<string, string> = {
  "/checklist": "체크",
  "/chat": "상담",
  "/planner": "일정",
  "/trips": "내일정",
  "/budget": "예산",
  "/restaurants": "맛집",
  "/attractions": "관광",
  "/stays": "숙박",
  "/settings/notifications": "알림",
};

export function ShortcutsMobileBar() {
  const pathname = usePathname();

  return (
    <div className="shortcuts-mobile-bar view-mobile-only border-b border-[var(--border)] bg-white px-4 py-3">
      <p className="mb-2 text-xs font-bold text-[#555]">바로가기</p>
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FEATURES.map((f) => {
          const Icon = ICONS[f.href] ?? MapPin;
          const active = pathname === f.href || pathname.startsWith(`${f.href}/`);

          return (
            <Link
              key={f.href}
              href={f.href}
              className={`flex min-w-[4.25rem] shrink-0 flex-col items-center gap-1 rounded-xl border px-2.5 py-2 ${
                active
                  ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]"
                  : "border-[#eee] bg-[#fafafa] text-[#666]"
              }`}
            >
              <Icon size={18} />
              <span className="text-[10px] font-medium">{MOBILE_LABELS[f.href]}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
