import { AppShell } from "@/shared/layout/app-shell";
import { NotificationForm } from "@/features/notifications/components/notification-form";

export default function NotificationSettingsPage() {
  return (
    <AppShell title="카카오 일정 알림">
      <ul className="mb-4 list-inside list-disc space-y-1 text-sm text-slate-600">
        <li>매일 지정 시간에 당일 여행 일정을 카카오톡으로 발송</li>
        <li>일정 항목: 장소명 · 시간 · 이동수단</li>
        <li>알림 수신 여부·발송 시간은 아래에서 설정</li>
        <li>카카오 로그인 시 수신 대상 ID 자동 저장</li>
      </ul>
      <NotificationForm />
    </AppShell>
  );
}
