import fs from "fs";
import path from "path";
import type { Region, Theme } from "./detector";

export interface RagItem {
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

// 데이터 파일 로드
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

// 키워드 기반 관련도 점수 계산
function scoreItem(item: RagItem, query: string): number {
  const lower = query.toLowerCase();
  let score = 0;

  if (item.name && lower.includes(item.name.toLowerCase())) score += 10;
  if (item.description && item.description.toLowerCase().split(" ")
    .some((w) => lower.includes(w))) score += 3;
  if (item.tags) {
    item.tags.forEach((tag) => {
      if (lower.includes(tag.toLowerCase())) score += 5;
    });
  }

  return score;
}

// RAG 검색 메인 함수
export function searchRag(
  query: string,
  region: Region,
  themes: Theme[],
  topK = 5
): RagResult[] {
  // 주제가 없으면 전체 주제 검색
  const targetThemes: Theme[] =
    themes.length > 0
      ? themes
      : ["healing", "shopping", "sightseeing", "otaku", "food", "culture"];

  const results: RagResult[] = [];

  for (const theme of targetThemes) {
    const items = loadData(region, theme);
    if (items.length === 0) continue;

    // 관련도 점수 기반 정렬
    const scored = items
      .map((item) => ({ item, score: scoreItem(item, query) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((s) => s.item);

    results.push({ region, theme, items: scored });
  }

  return results;
}

// RAG 결과 → 프롬프트용 텍스트 변환
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