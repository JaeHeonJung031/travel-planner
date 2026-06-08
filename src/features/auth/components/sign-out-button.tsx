"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

type SignOutButtonProps = {
  className?: string;
  children?: React.ReactNode;
};

export function SignOutButton({
  className = "text-sm text-slate-600 underline",
  children = "로그아웃",
}: SignOutButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    await signOut({ callbackUrl: "/" });
  }

  return (
    <button
      type="button"
      className={className}
      onClick={handleSignOut}
      disabled={loading}
    >
      {loading ? "로그아웃 중..." : children}
    </button>
  );
}
