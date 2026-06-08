"use client";

import { ShortcutsMobileBar } from "./shortcuts-mobile-bar";
import { ShortcutsSidebar } from "./shortcuts-sidebar";

export function PageWithSidebar({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-with-sidebar mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <ShortcutsSidebar />
      <div className="page-main-content min-w-0 flex-1">
        <ShortcutsMobileBar />
        {children}
      </div>
    </div>
  );
}
