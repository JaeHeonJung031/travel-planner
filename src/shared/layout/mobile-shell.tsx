import { SiteHeader } from "./site-header";
import { BottomNav } from "./bottom-nav";
import { PageWithSidebar } from "./page-with-sidebar";

export function MobileShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="view-mobile-shell mx-auto flex min-h-full w-full max-w-lg flex-col bg-[var(--background)]">
      <SiteHeader />
      {title ? (
        <div className="border-b border-[var(--border)] bg-white px-4 py-3.5">
          <h1 className="text-xl font-bold text-[var(--foreground)]">{title}</h1>
        </div>
      ) : null}
      <main className="flex-1 pb-24">
        <PageWithSidebar>{children}</PageWithSidebar>
      </main>
      <BottomNav />
    </div>
  );
}
