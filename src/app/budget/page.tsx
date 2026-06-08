import { AppShell } from "@/shared/layout/app-shell";
import { BudgetPanel } from "@/features/budget/components/budget-panel";

export default function BudgetPage() {
  return (
    <AppShell title="예산 관리">
      <BudgetPanel />
    </AppShell>
  );
}
