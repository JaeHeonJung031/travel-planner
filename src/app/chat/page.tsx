import { AppShell } from "@/shared/layout/app-shell";
import { ChatPanel } from "@/features/chat/components/chat-panel";

export default function ChatPage() {
  return (
    <AppShell title="AI 여행 상담">
      <p className="mb-3 text-sm text-slate-600">
        로그인 시 구글·카카오 계정과 연동된 대화 세션이 유지됩니다.
      </p>
      <ChatPanel />
    </AppShell>
  );
}
