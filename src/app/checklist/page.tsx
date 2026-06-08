import { AppShell } from "@/shared/layout/app-shell";
import { ChecklistPanel } from "@/features/checklist/components/checklist-panel";

export default function ChecklistPage() {
  return (
    <AppShell title="여행 체크리스트">
      <p className="mb-4 text-sm text-slate-600">
        한국→일본 출발 전 준비물을 자동 생성하고, 커스텀 항목을 추가·삭제할 수 있습니다.
      </p>
      <ChecklistPanel />
    </AppShell>
  );
}
