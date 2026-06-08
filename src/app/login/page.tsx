import Link from "next/link";
import { Suspense } from "react";
import { AppShell } from "@/shared/layout/app-shell";
import { LoginForm } from "@/features/auth/components/login-form";
import { SocialLoginSection } from "@/features/auth/components/social-login-section";
import { AuthErrorBanner } from "@/features/auth/components/auth-error-banner";

export default function LoginPage() {
  return (
    <AppShell title="로그인">
      <div className="space-y-6">
        <Suspense fallback={null}>
          <AuthErrorBanner />
        </Suspense>
        <Suspense fallback={<p className="text-sm text-slate-400">로딩 중...</p>}>
          <LoginForm />
        </Suspense>
        <div className="relative text-center text-sm text-slate-400">
          <span className="bg-slate-50 px-2">또는</span>
        </div>
        <Suspense fallback={<p className="text-sm text-slate-400">로딩 중...</p>}>
          <SocialLoginSection />
        </Suspense>
        <p className="text-center text-sm text-slate-600">
          계정이 없으신가요?{" "}
          <Link href="/register" className="font-medium text-rose-600">
            회원가입
          </Link>
        </p>
        <p className="text-center text-sm">
          <Link href="/forgot-password" className="text-slate-500 underline">
            비밀번호 찾기
          </Link>
        </p>
      </div>
    </AppShell>
  );
}
