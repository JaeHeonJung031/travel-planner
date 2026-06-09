"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

type ItineraryPlace = {
  placeId: string;
  name: string;
  recommendedTime: string;
  visitDuration?: string;
  contextualMemo: string;
};

type ItineraryDay = {
  day: number;
  dayTheme: string;
  places: ItineraryPlace[];
};

type Itinerary = {
  title: string;
  totalDays: number;
  summary: string;
  schedule: ItineraryDay[];
};

type Message = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  itinerary?: any;
};

// reply에서 JSON 파싱 시도하는 헬퍼 함수 추가 (컴포넌트 밖에 선언)
function extractItinerary(reply: string): { text: string; itinerary: any | null } {
  const jsonMatch = reply.match(/```json\n?([\s\S]*?)\n?```/);
  if (!jsonMatch) return { text: reply, itinerary: null };

  try {
    const parsed = JSON.parse(jsonMatch[1]);
    // days 구조면 itinerary로 처리
    if (parsed.days || parsed.schedule) {
      const text = reply.replace(/```json[\s\S]*?```/g, "").trim();
      return { text, itinerary: parsed };
    }
  } catch {
    // 파싱 실패시 원본 반환
  }
  return { text: reply, itinerary: null };
}

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

  // 대화 초기화 함수
  async function clearHistory() {
    if (!confirm("대화 내역을 모두 삭제할까요?")) return;
    try {
      await fetch("/api/chat/sessions", { method: "DELETE" });
      setMessages([]);
      setSessionId(undefined);
      setSuggested(DEFAULT_SUGGESTED);
    } catch {
      setError("대화 초기화에 실패했습니다.");
    }
  }

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
      if (!res.ok) throw new Error(data.error ?? "전송 실패");
      if (data.sessionId) setSessionId(data.sessionId);
      if (data.suggestedQuestions?.length) setSuggested(data.suggestedQuestions);

      const { text: replyText, itinerary: parsedItinerary } = extractItinerary(data.reply);
        setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: replyText,
          itinerary: data.itinerary ?? parsedItinerary ?? undefined,
        },
      ]);
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

      {/* 추천 질문 + 초기화 버튼 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex flex-wrap gap-2">
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
        {/* 대화 초기화 버튼 */}
        {messages.length > 0 && (
          <button
            type="button"
            onClick={clearHistory}
            className="text-xs text-slate-400 hover:text-red-500 transition ml-2 whitespace-nowrap"
          >
            🗑 대화 초기화
          </button>
        )}
      </div>

      {/* 메시지 목록 */}
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
          <div key={m.id ?? `${i}-${m.role}`}>
            <Card
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

            {/* 일정 카드 렌더링 */}
            {m.itinerary && (
              <div className="mr-8 mt-2 rounded-xl border border-rose-200 bg-white p-4 shadow-sm">
                <h3 className="font-bold text-rose-700 text-base mb-1">
                  🗾 {m.itinerary.title}
                </h3>
                {m.itinerary.summary && (
                  <p className="text-xs text-slate-500 mb-3">{m.itinerary.summary}</p>
                )}

                {/* planner.ts 구조 (schedule) */}
                {m.itinerary.schedule?.map((day: any) => (
                  <div key={day.day} className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="rounded-full bg-rose-500 text-white text-xs px-2 py-0.5 font-bold">
                        Day {day.day}
                      </span>
                      <span className="text-sm font-semibold text-slate-700">
                        {day.dayTheme}
                      </span>
                    </div>
                    <div className="space-y-2 pl-2">
                      {day.places?.map((place: any, pi: number) => (
                        <div key={pi} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm text-slate-800">
                              📍 {place.name}
                            </span>
                            <span className="text-xs text-rose-600 font-medium">
                              {place.recommendedTime}
                            </span>
                          </div>
                          {place.visitDuration && (
                            <p className="text-xs text-slate-400 mb-1">⏱ {place.visitDuration}</p>
                          )}
                          <p className="text-xs text-slate-600">{place.contextualMemo}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* 일반 Gemini 구조 (days) */}
                {m.itinerary.days?.map((day: any) => (
                  <div key={day.dayIndex} className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="rounded-full bg-rose-500 text-white text-xs px-2 py-0.5 font-bold">
                        Day {day.dayIndex}
                      </span>
                      <span className="text-sm font-semibold text-slate-700">
                        {day.theme}
                      </span>
                    </div>
                    <div className="space-y-2 pl-2">
                      {day.items?.map((item: any, pi: number) => (
                        <div key={pi} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm text-slate-800">
                              📍 {item.placeName}
                            </span>
                            <span className="text-xs text-rose-600 font-medium">
                              {item.startTime}{item.endTime ? ` - ${item.endTime}` : ""}
                            </span>
                          </div>
                          {item.transport && (
                            <p className="text-xs text-slate-400 mb-1">🚃 {item.transport}</p>
                          )}
                          {item.notes && (
                            <p className="text-xs text-slate-600">{item.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading ? (
          <p className="text-sm text-slate-400">답변 생성 중...</p>
        ) : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
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
