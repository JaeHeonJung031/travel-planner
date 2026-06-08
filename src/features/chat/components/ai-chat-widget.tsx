"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Bot, X } from "lucide-react";
import { ChatPanel } from "@/features/chat/components/chat-panel";

const HIDE_ON = new Set(["/login", "/register", "/forgot-password", "/chat"]);

function normalizePath(pathname: string) {
  return pathname.startsWith("/m") ? pathname.replace(/^\/m/, "") || "/" : pathname;
}

export function AiChatWidget() {
  const { status } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const path = normalizePath(pathname);

  useEffect(() => {
    if (HIDE_ON.has(path)) setOpen(false);
  }, [path]);

  if (status !== "authenticated") return null;
  if (HIDE_ON.has(path)) return null;

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="채팅 닫기"
          className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[1px] md:bg-black/10"
          onClick={() => setOpen(false)}
        />
      ) : null}

      {open ? (
        <div
          className="fixed bottom-24 right-4 z-[70] flex h-[min(70vh,520px)] w-[min(calc(100vw-2rem),400px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl md:bottom-6 md:right-6"
          role="dialog"
          aria-label="AI 여행 상담"
        >
          <header className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-gradient-to-r from-rose-500 to-orange-400 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <Bot size={18} />
              </span>
              <div>
                <p className="text-sm font-semibold">AI 여행 상담</p>
                <p className="text-[10px] text-white/80">임시 · 대화는 계정에 저장됩니다</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1.5 hover:bg-white/20"
              aria-label="닫기"
            >
              <X size={18} />
            </button>
          </header>
          <div className="flex min-h-0 flex-1 flex-col px-3 pb-3 pt-2">
            <ChatPanel variant="floating" />
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "AI 채팅 닫기" : "AI 채팅 열기"}
        aria-expanded={open}
        className="fixed bottom-24 right-4 z-[80] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-orange-400 text-white shadow-lg shadow-rose-500/30 transition hover:scale-105 hover:shadow-xl active:scale-95 md:bottom-6 md:right-6"
      >
        {open ? <X size={26} strokeWidth={2.25} /> : <Bot size={26} strokeWidth={2.25} />}
      </button>
    </>
  );
}
