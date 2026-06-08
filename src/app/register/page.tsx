import { Suspense } from "react";
import { AppShell } from "@/shared/layout/app-shell";
import { RegisterForm } from "@/features/auth/components/register-form";
import { SocialLoginSection } from "@/features/auth/components/social-login-section";

export default function RegisterPage() {
  return (
    <AppShell title="회원가입">
      <div className="space-y-6">
        <Suspense fallback={<p className="text-sm text-slate-400">로딩 중...</p>}>
          <SocialLoginSection />
        </Suspense>
        <RegisterForm />
      </div>
    </AppShell>
  );
}
