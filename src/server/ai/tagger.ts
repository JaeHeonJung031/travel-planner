import { callGemini, TAGGER_MODEL } from "./gemini";
import type { GooglePlace } from "./places";
import type { Theme } from "./detector";

export interface TaggedPlace {
  googleId: string;
  name: string;
  nameKo: string;
  description: string;
  tags: string[];
  theme: Theme;
  tips: string;
  address: string;
  lat: number;
  lng: number;
  rating: number | null;
  priceLevel: number | null;
  hours: string[] | null;
  imageUrl: string | null;
}

// LLM으로 장소 자동 태깅
export async function tagPlace(
  place: GooglePlace,
  region: string
): Promise<TaggedPlace | null> {
  // 리뷰 텍스트 추출 (최대 5개)
  const reviews = place.reviews
    ?.slice(0, 5)
    .map((r) => `"${r.text}"`)
    .join("\n") ?? "리뷰 없음";

  const prompt = `
다음은 일본 ${region} 지역의 장소 정보야. 아래 JSON 형식으로만 응답해줘. 다른 텍스트 없이 JSON만 출력해.

장소명: ${place.name}
주소: ${place.formatted_address}
평점: ${place.rating ?? "없음"}
구글 분류: ${place.types?.join(", ") ?? "없음"}
리뷰:
${reviews}

응답 형식:
{
  "nameKo": "한국어 장소명 (없으면 일본어 그대로)",
  "description": "한국인 여행자 관점에서 2~3문장 설명",
  "tags": ["태그1", "태그2", "태그3", "태그4", "태그5"],
  "theme": "healing 또는 shopping 또는 sightseeing 또는 otaku 또는 food 또는 culture 중 하나",
  "tips": "방문 시 유용한 팁 1~2문장"
}
`;

  try {
    const response = await callGemini(
  "당신은 일본 여행 데이터를 분석하는 전문가입니다. JSON 형식으로만 응답하세요.",
  [{ role: "user", parts: [{ text: prompt }] }],
  TAGGER_MODEL  // ← lite 모델
);

    // JSON 파싱
    const cleaned = response
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    return {
      googleId: place.place_id,
      name: place.name,
      nameKo: parsed.nameKo ?? place.name,
      description: parsed.description ?? "",
      tags: parsed.tags ?? [],
      theme: parsed.theme ?? "sightseeing",
      tips: parsed.tips ?? "",
      address: place.formatted_address ?? "",
      lat: place.geometry?.location?.lat ?? 0,
      lng: place.geometry?.location?.lng ?? 0,
      rating: place.rating ?? null,
      priceLevel: place.price_level ?? null,
      hours: place.opening_hours?.weekday_text ?? null,
      imageUrl: place.photos?.[0]
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${place.photos[0].photo_reference}&key=${process.env.GOOGLE_PLACES_API_KEY}`
        : null,
    };
  } catch (error) {
    console.error(`태깅 실패 (${place.name}):`, error);
    return null;
  }
}

// 여러 장소 배치 태깅
export async function tagPlaces(
  places: GooglePlace[],
  region: string
): Promise<TaggedPlace[]> {
  const results: TaggedPlace[] = [];

  for (const place of places) {
    // API 호출 간격 (과부하 방지)
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const tagged = await tagPlace(place, region);
    if (tagged) results.push(tagged);
  }

  return results;
}