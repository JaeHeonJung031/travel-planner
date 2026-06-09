const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY ?? "";
const BASE_URL = "https://maps.googleapis.com/maps/api/place";

export interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: { lat: number; lng: number };
  };
  rating?: number;
  price_level?: number;
  opening_hours?: {
    weekday_text: string[];
  };
  reviews?: {
    text: string;
    rating: number;
    language: string;
  }[];
  photos?: { photo_reference: string }[];
  types: string[];
}

// 지역별 검색 중심 좌표
export const REGION_COORDS = {
  TOKYO: { lat: 35.6762, lng: 139.6503, radius: 15000 },
  OSAKA_KYOTO: { lat: 34.6937, lng: 135.5023, radius: 20000 },
  SAPPORO: { lat: 43.0642, lng: 141.3469, radius: 15000 },
  FUKUOKA: { lat: 33.5904, lng: 130.4017, radius: 15000 },
};

// 주제별 검색 키워드
export const THEME_QUERIES: Record<string, string[]> = {
  healing: ["온천 spa", "공원 park", "료칸 ryokan"],
  shopping: ["쇼핑몰 shopping mall", "백화점 department store", "돈키호테"],
  sightseeing: ["관광명소 tourist attraction", "랜드마크 landmark"],
  otaku: ["애니메이트 animate", "피규어 figure shop", "만화 manga shop"],
  food: ["맛집 restaurant", "라멘 ramen", "스시 sushi"],
  culture: ["신사 shrine", "절 temple", "박물관 museum"],
};

// Places API 텍스트 검색
export async function searchPlaces(
  query: string,
  region: keyof typeof REGION_COORDS
): Promise<GooglePlace[]> {
  const coords = REGION_COORDS[region];

  const url = `${BASE_URL}/textsearch/json?query=${encodeURIComponent(query)}&location=${coords.lat},${coords.lng}&radius=${coords.radius}&language=ko&key=${PLACES_API_KEY}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== "OK") {
      console.error("Places API 오류:", data.status);
      return [];
    }

    return data.results as GooglePlace[];
  } catch (error) {
    console.error("Places API 호출 실패:", error);
    return [];
  }
}

// 장소 상세 정보 (리뷰 포함)
export async function getPlaceDetail(placeId: string): Promise<GooglePlace | null> {
  const fields = "place_id,name,formatted_address,geometry,rating,price_level,opening_hours,reviews,photos,types";
  const url = `${BASE_URL}/details/json?place_id=${placeId}&fields=${fields}&language=ko&reviews_no_translations=true&key=${PLACES_API_KEY}`;
  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== "OK") return null;
    return data.result as GooglePlace;
  } catch {
    return null;
  }
}

// 사진 URL 생성
export function getPhotoUrl(photoReference: string, maxWidth = 800): string {
  return `${BASE_URL}/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${PLACES_API_KEY}`;
}