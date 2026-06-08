"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

export function ProfileForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState(false);

  async function save() {
    await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Card className="space-y-3">
      <p className="text-sm font-medium">프로필 수정</p>
      <input
        placeholder="이름"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-xl border px-3 py-2 text-sm"
      />
      <input
        placeholder="전화번호"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="w-full rounded-xl border px-3 py-2 text-sm"
      />
      <Button type="button" onClick={save}>
        저장
      </Button>
      {saved ? <p className="text-sm text-emerald-600">저장되었습니다.</p> : null}
    </Card>
  );
}
