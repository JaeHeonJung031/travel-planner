import { AppShell } from "@/shared/layout/app-shell";
import { StaySearch } from "@/features/stays/components/stay-search";

export default function StaysPage() {
  return (
    <AppShell title="숙박 검색">
      <p className="mb-4 text-sm text-slate-600">
        AI 모델 연동 후 실제 숙소 검색 결과가 표시됩니다.
      </p>
      <StaySearch />
    </AppShell>
  );
}
