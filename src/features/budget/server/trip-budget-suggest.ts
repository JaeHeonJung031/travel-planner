import type { BudgetCategory } from "@prisma/client";

export type TripForBudgetSuggest = {
  region: string;
  totalBudget: number | null;
  days: {
    items: {
      placeName: string;
      transport?: string | null;
      notes?: string | null;
    }[];
  }[];
};

const CATEGORIES: BudgetCategory[] = [
  "ACCOMMODATION",
  "TRANSPORT",
  "FOOD",
  "SIGHTSEEING",
  "OTHER",
];

const BASE_RATIOS: Record<BudgetCategory, number> = {
  ACCOMMODATION: 0.32,
  TRANSPORT: 0.18,
  FOOD: 0.25,
  SIGHTSEEING: 0.15,
  OTHER: 0.1,
};

const TRANSPORT_KW = /지하철|버스|jr|신칸센|택시|열차|비행|공항|이동|도보 외/i;
const FOOD_KW = /라멘|맛집|야타이|점심|저녁|아침|식사|카페|스시|음식|먹|식당|베이커리/i;
const SIGHT_KW = /관광|사진|공원|신사|사찰|박물관|전망|야경|거리|야구|축제|참배/i;
const SHOP_KW = /쇼핑|몰|아울렛|면세|백화점|캐널/i;

function normalizeRatios(ratios: Record<BudgetCategory, number>): Record<BudgetCategory, number> {
  const sum = CATEGORIES.reduce((s, c) => s + ratios[c], 0);
  const out = { ...ratios };
  for (const c of CATEGORIES) {
    out[c] = ratios[c] / sum;
  }
  return out;
}

/** 일정 일수·장소·교통·지역을 반영한 카테고리별 배분 비율 */
export function suggestRatiosFromTrip(trip: TripForBudgetSuggest): Record<BudgetCategory, number> {
  const dayCount = Math.max(trip.days.length, 1);
  const items = trip.days.flatMap((d) => d.items);

  let transportHits = 0;
  let foodHits = 0;
  let sightHits = 0;
  let shopHits = 0;

  for (const item of items) {
    const text = `${item.placeName} ${item.notes ?? ""} ${item.transport ?? ""}`;
    if (TRANSPORT_KW.test(item.transport ?? "") || TRANSPORT_KW.test(text)) transportHits += 1;
    if (FOOD_KW.test(text)) foodHits += 1;
    if (SIGHT_KW.test(text)) sightHits += 1;
    if (SHOP_KW.test(text)) shopHits += 1;
  }

  const ratios = { ...BASE_RATIOS };

  ratios.ACCOMMODATION += (dayCount - 3) * 0.025;
  ratios.TRANSPORT += Math.min(transportHits * 0.012, 0.1);
  ratios.FOOD += Math.min(foodHits * 0.01, 0.08);
  ratios.SIGHTSEEING += Math.min(sightHits * 0.008 + shopHits * 0.006, 0.1);

  if (dayCount <= 2) {
    ratios.ACCOMMODATION -= 0.07;
    ratios.FOOD += 0.04;
    ratios.SIGHTSEEING += 0.03;
  }

  if (trip.region === "FUKUOKA") ratios.FOOD += 0.03;
  if (trip.region === "TOKYO") ratios.TRANSPORT += 0.025;
  if (trip.region === "OSAKA_KYOTO") ratios.SIGHTSEEING += 0.02;
  if (trip.region === "SAPPORO") ratios.ACCOMMODATION += 0.02;

  return normalizeRatios(ratios);
}

export function suggestAllocationsFromTrip(
  trip: TripForBudgetSuggest,
  totalKrw: number,
): { category: BudgetCategory; amountKrw: number }[] {
  const total = Math.max(Number(totalKrw) || 0, 0);
  const preferredTotal = trip.totalBudget && trip.totalBudget > 0 ? trip.totalBudget : total;
  const base = preferredTotal > 0 ? preferredTotal : total;

  const ratios = suggestRatiosFromTrip(trip);
  const raw = CATEGORIES.map((category) => ({
    category,
    amountKrw: Math.round(base * ratios[category]),
  }));

  const allocated = raw.reduce((s, a) => s + a.amountKrw, 0);
  const target = base > 0 ? base : total;
  if (target > 0 && allocated !== target) {
    const diff = target - allocated;
    const foodIdx = raw.findIndex((a) => a.category === "FOOD");
    if (foodIdx >= 0) raw[foodIdx].amountKrw += diff;
  }

  return raw;
}
