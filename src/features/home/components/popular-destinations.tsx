import Link from "next/link";
import { POPULAR_DESTINATIONS } from "@/features/home/lib/home-data";

export function PopularDestinations() {
  return (
    <section>
      <h2 className="section-title">인기 여행지</h2>
      <div className="destinations-grid">
        {POPULAR_DESTINATIONS.map((dest) => (
          <article key={dest.id} className="dest-card">
            <div
              className="dest-card-img"
              style={{ backgroundImage: `url('${dest.image}')` }}
            />
            <div className="p-5">
              <h3 className="mb-2 text-lg font-bold">{dest.title}</h3>
              <p className="mb-5 line-clamp-2 text-sm leading-relaxed text-[var(--muted)]">
                {dest.desc}
              </p>
              <Link href={dest.href} className="btn-card-dark">
                일정 짜기
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
