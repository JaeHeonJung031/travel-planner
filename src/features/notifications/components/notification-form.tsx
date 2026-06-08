"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

export function NotificationForm() {
  const [enabled, setEnabled] = useState(true);
  const [notifyTime, setNotifyTime] = useState("08:00");
  const [kakaoUserId, setKakaoUserId] = useState("");
  const [preview, setPreview] = useState("");
  const [tripTitle, setTripTitle] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [sendStatus, setSendStatus] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadPreview = useCallback(async () => {
    const res = await fetch("/api/notifications/preview");
    if (!res.ok) return;
    const d = await res.json();
    setPreview(d.preview ?? "");
    setTripTitle(d.tripTitle ?? null);
  }, []);

  useEffect(() => {
    fetch("/api/notifications/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.enabled !== undefined) setEnabled(d.enabled);
        if (d.notifyTime) setNotifyTime(d.notifyTime);
        if (d.kakaoUserId) setKakaoUserId(d.kakaoUserId);
      })
      .finally(() => setLoading(false));
    loadPreview();
  }, [loadPreview]);

  async function save() {
    setSaved(false);
    await fetch("/api/notifications/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled, notifyTime, kakaoUserId }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function sendTest() {
    setSending(true);
    setSendStatus("");
    const res = await fetch("/api/notifications/send-test", { method: "POST" });
    const d = await res.json();
    setSending(false);
    if (!res.ok) {
      setSendStatus(d.error ?? "발송 실패 — 카카오 재로그인(메시지 동의) 후 다시 시도");
      return;
    }
    setSendStatus(d.message ?? "카카오톡으로 보냈습니다.");
  }

  if (loading) {
    return <p className="text-sm text-slate-500">설정 불러오는 중...</p>;
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          알림 수신 (켜두면 매일 지정 시간에 발송)
        </label>

        <label className="block text-sm">
          <span className="font-medium">발송 시간</span>
          <input
            type="time"
            value={notifyTime}
            onChange={(e) => setNotifyTime(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
          />
        </label>

        <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
          {kakaoUserId ? (
            <>
              카카오 연동됨 (사용자 ID: <span className="font-mono">{kakaoUserId}</span>)
            </>
          ) : (
            <>
              카카오 로그인 후 자동으로 ID가 저장됩니다. 수동 입력:
              <input
                value={kakaoUserId}
                onChange={(e) => setKakaoUserId(e.target.value)}
                placeholder="카카오 숫자 ID"
                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 font-mono text-xs"
              />
            </>
          )}
        </div>

        <Button type="button" className="w-full" onClick={save}>
          설정 저장
        </Button>
        {saved ? <p className="text-center text-sm text-emerald-600">저장되었습니다.</p> : null}
      </Card>

      <Card className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-800">오늘 일정 미리보기</p>
          {tripTitle ? <span className="text-xs text-slate-500">{tripTitle}</span> : null}
        </div>
        <pre className="whitespace-pre-wrap rounded-xl bg-[#FEE500]/20 p-3 text-xs leading-relaxed text-slate-800">
          {preview || "오늘 진행 중인 여행 일정이 없습니다."}
        </pre>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
          <p className="font-medium">지정 시간 자동 발송 — 추가로 필요한 것</p>
          <p className="mt-1 leading-relaxed">
            <code className="rounded bg-white/80 px-1">CRON_SECRET</code>만으로는
            보내지 않습니다. <strong>매 분</strong> cron API를 호출하는 프로그램이
            켜져 있어야 합니다.
          </p>
          <ul className="mt-2 list-inside list-disc space-y-0.5">
            <li>
              로컬: <code className="rounded bg-white/80 px-1">start.bat</code>만 실행하면 Cron도
              함께 돌아갑니다 (CRON_SECRET 설정 시)
            </li>
            <li>배포: Vercel Cron + 환경 변수 <code className="rounded bg-white/80 px-1">CRON_SECRET</code></li>
            <li>발송 시간은 <strong>한국 시간(KST)</strong> 기준</li>
          </ul>
        </div>
        <p className="text-xs text-slate-500">
          포함 항목: 장소명 · 시간 · 이동수단. 카카오 로그인 + 「카카오톡 메시지 전송」 동의
          필요. 메시지는 본인 카카오톡 「나와의 채팅」으로 옵니다.
        </p>
        <Button
          type="button"
          className="w-full border border-[#F5DC00] bg-[#FEE500] font-medium text-[#191919] hover:bg-[#F5DC00]"
          onClick={sendTest}
          disabled={sending}
        >
          {sending ? "발송 중..." : "지금 카카오톡으로 테스트 발송"}
        </Button>
        {sendStatus ? <p className="text-center text-sm text-slate-700">{sendStatus}</p> : null}
        <Button type="button" variant="secondary" className="w-full" onClick={loadPreview}>
          미리보기 새로고침
        </Button>
      </Card>
    </div>
  );
}
