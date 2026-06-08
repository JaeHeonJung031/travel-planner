import { SiteHeader } from "@/shared/layout/site-header";
import { SiteFooter } from "@/shared/layout/site-footer";
import { NihonHero } from "./nihon-hero";
import { PopularDestinations } from "./popular-destinations";
import { PlannerPreviewSection } from "./planner-preview-section";

export function HomePageContent() {
  return (
    <div className="min-h-full bg-[var(--background)]">
      <SiteHeader />
      <NihonHero />
      <main className="mx-auto max-w-[1200px] px-5 py-14 md:px-5">
        <PopularDestinations />
        <PlannerPreviewSection />
      </main>
      <SiteFooter />
    </div>
  );
}
