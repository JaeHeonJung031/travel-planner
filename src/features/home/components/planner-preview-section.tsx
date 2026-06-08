import Link from "next/link";
import { PLANNER_TIMELINE } from "@/features/home/lib/home-data";

export function PlannerPreviewSection() {
  return (
    <section>
      <h2 className="section-title">나의 여행 일정 플래너 (예시)</h2>
      <div className="planner-preview">
        <div>
          <h3 className="mb-5 text-lg font-bold">6박 7일 도쿄 &amp; 교토 여행</h3>
          <div className="nihon-timeline">
            {PLANNER_TIMELINE.map((item) => (
              <div key={item.day} className="nihon-timeline-item">
                <p className="mb-1 font-bold text-[var(--primary)]">{item.day}</p>
                <p className="mb-1 text-base font-medium">{item.spot}</p>
                <p className="text-[13px] text-[#777]">{item.memo}</p>
              </div>
            ))}
          </div>
          <Link
            href="/planner"
            className="mt-6 inline-block text-sm font-medium text-[var(--primary)] hover:underline"
          >
            나만의 일정 만들기 →
          </Link>
        </div>
        <div className="map-mockup">🗺️ 지도 연동 영역 (준비 중)</div>
      </div>
    </section>
  );
}
