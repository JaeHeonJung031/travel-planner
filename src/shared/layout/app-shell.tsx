"use client";

import { useViewMode } from "@/shared/hooks/use-view-mode";
import { DesktopShell } from "./desktop-shell";
import { MobileShell } from "./mobile-shell";

export function AppShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const mode = useViewMode();

  if (mode === "mobile") {
    return <MobileShell title={title}>{children}</MobileShell>;
  }

  return <DesktopShell title={title}>{children}</DesktopShell>;
}
