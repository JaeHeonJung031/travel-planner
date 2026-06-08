"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/shared/ui/button";

export function DeleteAccountButton() {
  async function onDelete() {
    if (!confirm("계정을 탈퇴하시겠습니까? 모든 데이터가 삭제됩니다.")) return;
    await fetch("/api/user/delete", { method: "DELETE" });
    await signOut({ callbackUrl: "/" });
  }

  return (
    <Button type="button" variant="ghost" className="mt-6 text-rose-600" onClick={onDelete}>
      계정 탈퇴
    </Button>
  );
}
