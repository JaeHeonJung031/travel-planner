import { AppShell } from "@/shared/layout/app-shell";
import { Card } from "@/shared/ui/card";

export default function ForgotPasswordPage() {
  return (
    <AppShell title="비밀번호 찾기">
      <Card>
        <p className="text-sm text-slate-600">
          이메일 재설정 링크 발송 기능은 메일 서버 설정 후 활성화됩니다.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          비밀번호 재설정 요청 기능은 준비 중입니다.
        </p>
      </Card>
    </AppShell>
  );
}
