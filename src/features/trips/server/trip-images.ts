import { MOCK_ATTRACTIONS } from "@/features/attractions/server/mock-data";
import type { JapanRegionId } from "@/shared/lib/constants";

const PLACE_ALIASES: { keys: string[]; region: JapanRegionId; attractionId: string }[] = [
  { keys: ["오호리"], region: "FUKUOKA", attractionId: "ohori" },
  { keys: ["다자이후", "텐만구"], region: "FUKUOKA", attractionId: "dazaifu" },
  { keys: ["캐널시티", "캐널"], region: "FUKUOKA", attractionId: "canal-city" },
  { keys: ["나카스", "야타이"], region: "FUKUOKA", attractionId: "canal-city" },
  { keys: ["오사카성", "오사카"], region: "OSAKA_KYOTO", attractionId: "osaka-castle" },
  { keys: ["후시미", "이나리"], region: "OSAKA_KYOTO", attractionId: "fushimi-inari" },
  { keys: ["기요미즈"], region: "OSAKA_KYOTO", attractionId: "kiyomizu" },
  { keys: ["아라시야마", "대나무"], region: "OSAKA_KYOTO", attractionId: "arashiyama" },
  { keys: ["센소지", "아사쿠사"], region: "TOKYO", attractionId: "sensoji" },
  { keys: ["시부야", "도쿄타워", "전망"], region: "TOKYO", attractionId: "shibuya-sky" },
  { keys: ["메이지"], region: "TOKYO", attractionId: "meiji" },
  { keys: ["시계탑"], region: "SAPPORO", attractionId: "clock-tower" },
  { keys: ["오도리", "눈축제"], region: "SAPPORO", attractionId: "odori" },
  { keys: ["스스키노", "맥주"], region: "SAPPORO", attractionId: "susukino" },
];

function allAttractions() {
  return Object.values(MOCK_ATTRACTIONS).flat();
}

function findById(id: string) {
  return allAttractions().find((a) => a.id === id);
}

export function getRegionCoverImage(region: JapanRegionId, width = 1200): string {
  const first = MOCK_ATTRACTIONS[region]?.[0];
  if (!first?.imageUrl) {
    return `https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=${width}&q=85`;
  }
  return first.imageUrl.replace(/w=\d+/, `w=${width}`);
}

export function resolvePlaceImage(placeName: string, region: JapanRegionId): string {
  const compact = placeName.replace(/\s/g, "");

  for (const alias of PLACE_ALIASES) {
    if (alias.keys.some((k) => compact.includes(k.replace(/\s/g, "")))) {
      const hit = findById(alias.attractionId);
      if (hit?.imageUrl) return hit.imageUrl;
    }
  }

  const regional = MOCK_ATTRACTIONS[region] ?? [];
  for (const a of regional) {
    const name = a.name.replace(/\s/g, "");
    if (compact.includes(name) || name.includes(compact.slice(0, Math.min(4, compact.length)))) {
      return a.imageUrl ?? getRegionCoverImage(region);
    }
  }

  for (const a of allAttractions()) {
    const name = a.name.replace(/\s/g, "");
    if (compact.includes(name) || name.includes(compact.slice(0, 3))) {
      return a.imageUrl ?? getRegionCoverImage(region);
    }
  }

  return getRegionCoverImage(region);
}

type TripItemLike = { placeName: string };
type TripDayLike = { items: TripItemLike[] };
type TripLike = { region: JapanRegionId; days?: TripDayLike[] };

export function getTripCoverImage(trip: TripLike): string {
  for (const day of trip.days ?? []) {
    for (const item of day.items) {
      const url = resolvePlaceImage(item.placeName, trip.region);
      if (url) return url;
    }
  }
  return getRegionCoverImage(trip.region);
}

export function getTripGalleryImages(trip: TripLike, limit = 6): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();

  for (const day of trip.days ?? []) {
    for (const item of day.items) {
      const url = resolvePlaceImage(item.placeName, trip.region);
      if (!seen.has(url)) {
        seen.add(url);
        urls.push(url);
      }
      if (urls.length >= limit) return urls;
    }
  }

  if (urls.length === 0) urls.push(getRegionCoverImage(trip.region));
  return urls;
}
