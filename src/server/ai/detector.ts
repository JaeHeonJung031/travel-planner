export type Region = "TOKYO" | "OSAKA_KYOTO" | "SAPPORO" | "FUKUOKA";
export type Theme = "healing" | "shopping" | "sightseeing" | "otaku" | "food" | "culture";

export interface DetectResult {
  region: Region | null;
  themes: Theme[];
  days: number | null;        // 여행 일수
  isItineraryRequest: boolean; // 일정 생성 요청인지
}

// 지역 감지 키워드
const REGION_KEYWORDS: Record<Region, string[]> = {
  TOKYO: [
    "도쿄", "tokyo", "아키하바라", "시부야", "신주쿠", "하라주쿠",
    "아사쿠사", "롯폰기", "이케부쿠로", "우에노", "오다이바", "긴자",
    "시모키타자와", "나카메구로", "도쿄타워", "스카이트리", "요코하마",
    "가마쿠라", "닛코", "지브리", "디즈니랜드", "디즈니씨",
  ],
  OSAKA_KYOTO: [
    "오사카", "교토", "osaka", "kyoto", "도톤보리", "신사이바시",
    "아라시야마", "기온", "나라", "우메다", "난바", "덴덴타운",
    "후시미이나리", "금각사", "은각사", "니조성", "오사카성",
    "유니버설", "usj", "텐노지", "신세계", "구로몬시장",
  ],
  SAPPORO: [
    "삿포로", "sapporo", "홋카이도", "노보리베츠", "오타루",
    "스스키노", "니세코", "아사히카와", "시레토코", "비에이",
    "후라노", "삿포로 눈축제", "오도리공원", "시계탑", "라멘공화국",
  ],
  FUKUOKA: [
    "후쿠오카", "fukuoka", "하카타", "텐진", "유후인",
    "나가사키", "벳푸", "모지코", "다자이후", "캐널시티",
    "야타이", "나카스", "이마이즈미", "후쿠오카타워",
  ],
};

// 주제 감지 키워드
const THEME_KEYWORDS: Record<Theme, string[]> = {
  healing: [
    "힐링", "온천", "료칸", "휴식", "자연", "공원", "조용한",
    "여유", "온센", "스파", "노천탕", "숲", "산책", "힐링카페",
    "감성", "뷰맛집", "일몰", "새벽", "평화", "재충전",
  ],
  shopping: [
    "쇼핑", "구매", "옷", "백화점", "면세", "돈키호테", "마트",
    "쇼핑몰", "기념품", "드럭스토어", "마츠모토키요시", "코스메",
    "화장품", "브랜드", "명품", "빈티지", "고프로", "전자제품",
    "100엔샵", "다이소", "세리아", "편의점",
  ],
  sightseeing: [
    "관광", "명소", "유명한", "꼭 가야", "랜드마크", "투어",
    "구경", "볼거리", "전망대", "야경", "사진", "인생샷",
    "포토스팟", "관광지", "필수코스", "추천코스",
  ],
  otaku: [
    "애니", "코스프레", "피규어", "성지순례", "아키하바라",
    "덴덴타운", "굿즈", "덕질", "오타쿠", "망가", "만화",
    "게임", "가챠", "캐릭터샵", "애니메이트", "빌리지뱅가드",
    "포켓몬센터", "닌텐도", "지브리", "코믹마켓", "코미케",
    "메이드카페", "이세계", "라이트노벨",
  ],
  food: [
    "맛집", "먹을거리", "라멘", "스시", "맛있는", "식당",
    "카페", "음식", "타코야키", "야키토리", "이자카야",
    "오마카세", "초밥", "우동", "소바", "돈카츠", "야키니쿠",
    "모츠나베", "하카타라멘", "미소라멘", "카레", "멜론빵",
    "길거리음식", "편의점음식", "푸드코트", "새벽식당",
  ],
  culture: [
    "문화", "역사", "신사", "절", "전통", "박물관", "기모노",
    "마츠리", "축제", "다도", "꽃꽂이", "도예", "서예",
    "사무라이", "닌자", "일본문화", "전통시장", "오래된거리",
    "성", "유네스코", "세계유산",
  ],
};

// 일정 생성 요청 키워드
const ITINERARY_KEYWORDS = [
  "일정", "코스", "짜줘", "만들어줘", "추천해줘", "계획", "플랜", "여행 계획",
];

// 기간 파싱 (ex: "3박 4일" → 4, "4일" → 4, "3박" → 4)
function parseDays(text: string): number | null {
  // "X박 Y일" 패턴
  const nightDayMatch = text.match(/(\d+)박\s*(\d+)일/);
  if (nightDayMatch) return parseInt(nightDayMatch[2]);

  // "X일" 패턴
  const dayMatch = text.match(/(\d+)일/);
  if (dayMatch) return parseInt(dayMatch[1]);

  // "X박" 패턴 → 박 + 1 = 일
  const nightMatch = text.match(/(\d+)박/);
  if (nightMatch) return parseInt(nightMatch[1]) + 1;

  return null;
}

export function detect(text: string): DetectResult {
  const lower = text.toLowerCase();

  // 지역 감지
  let region: Region | null = null;
  for (const [r, keywords] of Object.entries(REGION_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) {
      region = r as Region;
      break;
    }
  }

  // 주제 감지 (복수 가능)
  const themes: Theme[] = [];
  for (const [t, keywords] of Object.entries(THEME_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) {
      themes.push(t as Theme);
    }
  }

  // 기간 파싱
  const days = parseDays(text);

  // 일정 생성 요청 감지
  const isItineraryRequest =
    ITINERARY_KEYWORDS.some((k) => text.includes(k)) && (region !== null || days !== null);

  return { region, themes, days, isItineraryRequest };
}