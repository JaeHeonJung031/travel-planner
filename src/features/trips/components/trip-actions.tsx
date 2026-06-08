"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";

export function TripActions({ tripId, shareToken }: { tripId: string; shareToken: string | null }) {
  const [token, setToken] = useState(shareToken);
  const [inviteEmail, setInviteEmail] = useState("");

  async function createShareLink() {
    const res = await fetch(`/api/trips/${tripId}/share`, { method: "POST" });
    const data = await res.json();
    setToken(data.shareToken);
  }

  async function invite() {
    await fetch(`/api/trips/${tripId}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail }),
    });
    setInviteEmail("");
    alert("초대가 전송되었습니다. (이메일 연동 후 실제 발송)");
  }

  const shareUrl = token ? `${window.location.origin}/share/${token}` : "";

  return (
    <div className="space-y-3">
      <Button type="button" variant="secondary" onClick={createShareLink}>
        공유 링크 생성
      </Button>
      {shareUrl ? (
        <p className="break-all text-xs text-slate-600">{shareUrl}</p>
      ) : null}
      <div className="flex gap-2">
        <input
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          placeholder="동행자 이메일"
          className="flex-1 rounded-xl border px-3 py-2 text-sm"
        />
        <Button type="button" onClick={invite}>
          초대
        </Button>
      </div>
    </div>
  );
}
