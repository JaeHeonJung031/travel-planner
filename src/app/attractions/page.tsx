import { Suspense } from "react";
import { AppShell } from "@/shared/layout/app-shell";
import { AttractionList } from "@/features/attractions/components/attraction-list";

export default function AttractionsPage() {
  return (
    <AppShell title="관광지 정보">
      <Suspense fallback={<p className="text-sm text-slate-500">불러오는 중...</p>}>
        <AttractionList />
      </Suspense>
    </AppShell>
  );
}