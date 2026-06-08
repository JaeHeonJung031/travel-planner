"use client";

import { useSearchParams } from "next/navigation";

const MESSAGES: Record<string, string> = {
  Configuration:
    "구글 OAuth Client Secret이 잘못되었습니다. Google Cloud Console에서 Secret을 새로 발급해 .env 의 AUTH_GOOGLE_SECRET 에 넣으세요. (AUTH_SECRET·AUTH_URL 은 이미 설정되어 있어도 이 오류가 날 수 있습니다.)",
  AccessDenied: "로그인이 거부되었습니다.",
  OAuthSignin: "구글 로그인 시작에 실패했습니다.",
  OAuthCallback:
    "구글 로그인 콜백 실패입니다. AUTH_GOOGLE_SECRET 과 Client ID가 같은 OAuth 클라이언트의 짝인지 확인하세요.",
  CallbackRouteError:
    "구글 토큰 교환 실패입니다. AUTH_GOOGLE_SECRET 을 Google Cloud에서 다시 복사하세요.",
  Default:
    "로그인 중 오류가 발생했습니다. 잠시 후 다시 시도하거나 이메일 로그인을 이용하세요.",
};

export function AuthErrorBanner() {
  const params = useSearchParams();
  const error = params.get("error");

  if (!error) return null;

  const message = MESSAGES[error] ?? MESSAGES.Default;
  const isGoogleOAuth =
    error === "Configuration" ||
    error === "CallbackRouteError" ||
    error === "OAuthCallback" ||
    error === "OAuthSignin";

  return (
    <div
      role="alert"
      className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
    >
      <p className="font-medium">로그인 오류</p>
      <p className="mt-1">{message}</p>
      {isGoogleOAuth ? (
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-rose-700">
          <li>
            <a
              href="https://console.cloud.google.com/apis/credentials"
              className="underline"
              target="_blank"
              rel="noreferrer"
            >
              Google Cloud → 사용자 인증 정보
            </a>
          </li>
          <li>
            Client ID가 <code className="rounded bg-rose-100 px-1">696409216798-...</code> 인 OAuth
            클라이언트 선택
          </li>
          <li>클라이언트 보안 비밀번호 → <strong>비밀번호 만들기</strong> → 새 Secret 복사</li>
          <li>
            <code className="rounded bg-rose-100 px-1">.env</code>의{" "}
            <code className="rounded bg-rose-100 px-1">AUTH_GOOGLE_SECRET</code>만 교체 후 서버 재시작
          </li>
          <li>
            리디렉션 URI:{" "}
            <code className="rounded bg-rose-100 px-1">
              http://localhost:3000/api/auth/callback/google
            </code>
          </li>
        </ol>
      ) : null}
    </div>
  );
}



