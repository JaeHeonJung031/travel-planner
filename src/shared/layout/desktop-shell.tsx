import { SiteHeader } from "./site-header";
import { PageWithSidebar } from "./page-with-sidebar";

export function DesktopShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="view-desktop-shell min-h-full bg-[var(--background)]">
      <SiteHeader />
      <PageWithSidebar>
        {title ? (
          <header className="page-section-header mb-8 border-b border-[var(--border)] pb-5">
            <h1 className="section-title">{title}</h1>
          </header>
        ) : null}
        {children}
      </PageWithSidebar>
    </div>
  );
}
