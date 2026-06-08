"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

type Message = { id?: string; role: "user" | "assistant"; content: string };

const DEFAULT_SUGGESTED = [
  "오사카 2박3일 코스 추천해줘",
  "교토 당일치기 이동 방법은?",
  "예산 150만원으로 식비·숙박 나눠줘",
];

type ChatPanelProps = {
  variant?: "page" | "floating";
};

export function ChatPanel({ variant = "page" }: ChatPanelProps) {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggested, setSuggested] = useState<string[]>(DEFAULT_SUGGESTED);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setError("");
    try {
      const res = await fetch("/api/chat/sessions");
      if (res.status === 401) {
        setMessages([]);
        setSessionId(undefined);
        return;
      }
      if (!res.ok) throw new Error("대화 불러오기 실패");
      const data = await res.json();
      if (data.sessionId) setSessionId(data.sessionId);
      if (data.messages) setMessages(data.messages);
    } catch {
      setError("이전 대화를 불러오지 못했습니다.");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated" || !session?.user?.id) {
      setMessages([]);
      setSessionId(undefined);
      setHistoryLoading(false);
      return;
    }
    loadHistory();
  }, [status, session?.user?.id, loadHistory]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    if (!text.trim() || loading || status !== "authenticated") return;
    setError("");
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "전송 실패");
      }
      if (data.sessionId) setSessionId(data.sessionId);
      if (data.suggestedQuestions?.length) {
        setSuggested(data.suggestedQuestions);
      }
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "메시지 전송에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const isFloating = variant === "floating";
  const heightClass = isFloating ? "h-full min-h-0" : "h-[calc(100vh-220px)]";

  return (
    <div className={`flex flex-col ${heightClass}`}>
      <div className={`flex flex-wrap gap-2 ${isFloating ? "mb-2" : "mb-2"}`}>
        {suggested.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => send(q)}
            disabled={loading || historyLoading}
            className="rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {historyLoading ? (
          <p className="text-sm text-slate-400">이전 대화 불러오는 중...</p>
        ) : null}
        {!historyLoading && messages.length === 0 ? (
          <p className="text-sm text-slate-500">
            일본 여행에 대해 무엇이든 물어보세요. 대화는 로그인 계정에 저장됩니다.
          </p>
        ) : null}
        {messages.map((m, i) => (
          <Card
            key={m.id ?? `${i}-${m.role}-${m.content.slice(0, 12)}`}
            className={
              m.role === "user"
                ? isFloating
                  ? "ml-6 border-rose-100 bg-rose-50 py-2.5"
                  : "ml-8 bg-rose-50"
                : isFloating
                  ? "mr-6 py-2.5"
                  : "mr-8"
            }
          >
            <p className="text-sm whitespace-pre-wrap">{m.content}</p>
          </Card>
        ))}
        {loading ? <p className="text-sm text-slate-400">답변 생성 중...</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div ref={bottomRef} />
      </div>

      <form
        className={`flex gap-2 ${isFloating ? "mt-2 border-t border-slate-100 pt-2" : "mt-3"}`}
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="여행 질문을 입력하세요"
          disabled={historyLoading}
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
        />
        <Button
          type="submit"
          disabled={loading || historyLoading}
          className={isFloating ? "px-3 py-2 text-xs" : undefined}
        >
          전송
        </Button>
      </form>
    </div>
  );
}
