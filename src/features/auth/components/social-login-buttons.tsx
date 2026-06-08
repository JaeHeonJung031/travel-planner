"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

type SocialLoginButtonsProps = {
  google?: boolean;
  kakao?: boolean;
  callbackUrl?: string;
};

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function KakaoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.87 5.35 4.7 6.84L5.5 21.5c-.1.3.25.54.5.38l4.12-2.74c.77.11 1.56.17 2.38.17 5.52 0 10-3.58 10-8S17.52 3 12 3z" />
    </svg>
  );
}

function SocialContinueButton({
  children,
  icon,
  className,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  className: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`relative flex h-12 w-full items-center justify-center rounded-lg text-[15px] font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      <span className="absolute left-4 flex shrink-0 items-center justify-center">{icon}</span>
      {children}
    </button>
  );
}

function SocialLoginButtonsInner({
  google = false,
  kakao = false,
  callbackUrl: callbackUrlProp,
}: SocialLoginButtonsProps) {
  const params = useSearchParams();
  const callbackUrl = callbackUrlProp ?? params.get("callbackUrl") ?? "/";
  const [pending, setPending] = useState<"google" | "kakao" | null>(null);

  async function handleSignIn(provider: "google" | "kakao") {
    setPending(provider);
    try {
      await signIn(provider, { callbackUrl });
    } finally {
      setPending(null);
    }
  }

  if (!google && !kakao) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        소셜 로그인을 쓰려면 .env 에 Google 또는 Kakao OAuth 키를 설정하세요.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {kakao ? (
        <SocialContinueButton
          disabled={pending !== null}
          className="bg-[#FEE500] text-[#191919] hover:bg-[#F5DC00]"
          icon={<KakaoIcon className="h-[18px] w-[18px]" />}
          onClick={() => handleSignIn("kakao")}
        >
          {pending === "kakao" ? "연결 중..." : "카카오로 계속하기"}
        </SocialContinueButton>
      ) : null}
      {google ? (
        <SocialContinueButton
          disabled={pending !== null}
          className="bg-[#F2F2F2] text-[#191919] hover:bg-[#E8E8E8]"
          icon={<GoogleIcon className="h-5 w-5" />}
          onClick={() => handleSignIn("google")}
        >
          {pending === "google" ? "연결 중..." : "구글로 계속하기"}
        </SocialContinueButton>
      ) : null}
    </div>
  );
}

export function SocialLoginButtons(props: SocialLoginButtonsProps) {
  return (
    <Suspense fallback={<p className="text-sm text-slate-400">로딩 중...</p>}>
      <SocialLoginButtonsInner {...props} />
    </Suspense>
  );
}
