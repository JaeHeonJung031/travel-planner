import fs from "fs";
import path from "path";
import { prisma } from "@/server/db/prisma"; // 👈 프로젝트의 prisma 인스턴스 경로 확인
import { JapanRegion } from "@prisma/client"; // 👈 에넘 타입 확인
import { searchPlaces, getPlaceDetail } from "./places"; // 👈 STEP 6에서 만든 클라이언트
import type { Region, Theme } from "./detector";

export interface RagItem {
  id?: string; // 💡 DB 조회를 위해 id 필드 선택적 추가
  name: string;
  description: string;
  tags: string[];
  location?: string;
  price?: string;
  hours?: string;
  tips?: string;
}

export interface RagResult {
  region: Region;
  theme: Theme;
  items: RagItem[];
}

// 1. 기존 로컬 JSON 데이터 파일 로드 함수 (그대로 유지)
function loadData(region: Region, theme: Theme): RagItem[] {
  try {
    const filePath = path.join(
      process.cwd(),
      "data",
      region.toLowerCase().replace("_", "-"),
      `${theme}.json`
    );
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as RagItem[];
  } catch {
    return [];
  }
}

// 2. 키워드 기반 관련도 점수 계산 함수 (그대로 유지)
function scoreItem(item: RagItem, query: string): number {
  const lower = query.toLowerCase();
  let score = 0;

  if (item.name && lower.includes(item.name.toLowerCase())) score += 10;
  if (item.description && item.description.toLowerCase().split(" ").some((w) => lower.includes(w))) score += 3;
  if (item.tags) {
    item.tags.forEach((tag) => {
      if (lower.includes(tag.toLowerCase())) score += 5;
    });
  }

  return score;
}

/**
 * 🚀 [STEP 9 개량] RAG 검색 메인 함수 (로컬 파일 + Prisma DB 검색 + Google Fallback 통합)
 */
export async function searchRag(
  query: string,
  region: Region,
  themes: Theme[],
  topK = 5
): Promise<RagResult[]> {
  const targetThemes: Theme[] =
    themes.length > 0
      ? themes
      : ["healing", "shopping", "sightseeing", "otaku", "food", "culture"];

  const results: RagResult[] = [];

  // 매핑용 매개변수 변환 (Region 문자열 -> Prisma JapanRegion 에넘 타입)
  const prismaRegion = region.toUpperCase() as JapanRegion;

  for (const theme of targetThemes) {
    // [A] 로컬 JSON 데이터 먼저 확보
    let items = loadData(region, theme);

    try {
      // [B] STEP 9 핵심: Prisma DB(Place 모델)에서 누적된 장소 추가 조회
      const dbPlaces = await prisma.place.findMany({
        where: {
          region: prismaRegion,
          theme: theme,
        },
      });

      // DB 장소들을 RagItem 형태로 규격화하여 로컬 배열과 병합
      const mappedDbItems: RagItem[] = dbPlaces.map((p : any) => ({
        id: p.id,
        name: p.nameKo || p.name,
        description: p.description,
        tags: p.tags,
        location: p.address || undefined,
        hours: p.hours ? JSON.stringify(p.hours) : undefined,
        tips: p.tips || undefined,
      }));

      items = [...items, ...mappedDbItems];
    } catch (dbError) {
      console.error(`[RAG DB 조회 실패]:`, dbError);
    }

    // [C] Fallback: 만약 로컬과 DB 모두 뒤졌는데 해당 테마의 장소가 너무 부족하다면 (3개 미만)?
    // STEP 6/7 Google Places API를 동적으로 발동해 크롤링 후 DB 캐싱 처리
    if (items.length < 3) {
      console.log(`[RAG] ${theme} 테마의 데이터 부족으로 Google Places API 가동`);
      try {
        const googlePlaces = await searchPlaces(`${region} ${theme}`, region);
        
        for (const gPlace of googlePlaces.slice(0, 3)) {
          const detail = await getPlaceDetail(gPlace.place_id);
          if (!detail) continue;

          // 중복 검사 후 DB 인서트
          const exists = await prisma.place.findUnique({ where: { googleId: gPlace.place_id } });
          if (!exists) {
            const newPlace = await prisma.place.create({
              data: {
                googleId: detail.place_id,
                region: prismaRegion,
                theme: theme,
                name: detail.name,
                nameKo: detail.name,
                description: detail.reviews?.[0]?.text || `${detail.name}은(는) 이 지역의 유명 명소입니다.`,
                address: detail.formatted_address,
                lat: detail.geometry?.location?.lat,
                lng: detail.geometry?.location?.lng,
                rating: detail.rating,
                tags: detail.types || [],
                verified: false, // 추후 STEP 8 어드민 검수용
              },
            });

            items.push({
              id: newPlace.id,
              name: newPlace.name,
              description: newPlace.description,
              tags: newPlace.tags,
              location: newPlace.address || undefined,
            });
          }
        }
      } catch (apiError) {
        console.error("[RAG Google Fallback 실패]:", apiError);
      }
    }

    // [D] 관련도 점수 기반 정렬 및 TopK 슬라이싱 (기존 로직 유지)
    if (items.length === 0) continue;

    
    const scored = items
      .map((item) => ({ item, score: scoreItem(item, query) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((s) => s.item);

    results.push({ region, theme, items: scored });
  }

  return results;
}

// 3. RAG 결과 → 프롬프트용 텍스트 변환 함수 (기존 구조 그대로 유지)
export function ragToText(results: RagResult[]): string {
  if (results.length === 0) return "";

  const THEME_LABEL: Record<Theme, string> = {
    healing: "힐링/온천",
    shopping: "쇼핑",
    sightseeing: "관광명소",
    otaku: "덕질/애니",
    food: "맛집/음식",
    culture: "문화/역사",
  };

  let text = "=== 관련 여행 정보 ===\n";

  for (const result of results) {
    if (result.items.length === 0) continue;
    text += `\n[ ${THEME_LABEL[result.theme]} ]\n`;

    for (const item of result.items) {
      text += `• ${item.name}: ${item.description}`;
      if (item.location) text += ` | 위치: ${item.location}`;
      if (item.price) text += ` | 가격: ${item.price}`;
      if (item.hours) text += ` | 운영시간: ${item.hours}`;
      if (item.tips) text += ` | 팁: ${item.tips}`;
      text += "\n";
    }
  }

  return text;
}