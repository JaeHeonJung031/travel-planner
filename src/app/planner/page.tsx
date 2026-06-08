import { Suspense } from "react";
import { AppShell } from "@/shared/layout/app-shell";
import { PlannerPanel } from "@/features/planner/components/planner-panel";

export default function PlannerPage() {
  return (
    <AppShell title="일정 자동 생성">
      <p className="mb-4 text-sm text-slate-600">
        조건 입력 후 AI 일정을 생성하고, 드래그 앤 드롭으로 순서를 변경할 수 있습니다.
      </p>
      <Suspense fallback={<p className="text-sm text-slate-400">로딩 중...</p>}>
        <PlannerPanel />
      </Suspense>
    </AppShell>
  );
}
