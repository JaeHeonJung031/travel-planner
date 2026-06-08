export const APP_NAME = "MY TRIP";

export const JAPAN_REGIONS = [
  { id: "OSAKA_KYOTO", label: "오사카·교토", description: "간사이 권역 통합 일정" },
  { id: "FUKUOKA", label: "후쿠오카", description: "규슈·하카타 중심" },
  { id: "TOKYO", label: "도쿄", description: "수도권·근교" },
  { id: "SAPPORO", label: "삿포로", description: "홋카이도" },
] as const;

export type JapanRegionId = (typeof JAPAN_REGIONS)[number]["id"];

export const BUDGET_CATEGORIES = [
  { id: "ACCOMMODATION", label: "숙박", color: "#ff4757" },
  { id: "TRANSPORT", label: "교통", color: "#5352ed" },
  { id: "FOOD", label: "식비", color: "#ffa502" },
  { id: "SIGHTSEEING", label: "관광", color: "#2ed573" },
  { id: "OTHER", label: "기타", color: "#94a3b8" },
] as const;

export const FEATURES = [
  { href: "/checklist", title: "여행 체크리스트", desc: "한국→일본 출발 전 준비물" },
  { href: "/chat", title: "AI 여행 상담", desc: "자연어 챗봇 · 대화 이력 유지" },
  { href: "/planner", title: "일정 자동 생성", desc: "조건별 일정 · 드래그 앤 드롭" },
  { href: "/trips", title: "일정 저장·공유", desc: "마이페이지 · 동행자 편집" },
  { href: "/budget", title: "예산 관리", desc: "배분 제안 · 환율 반영" },
  { href: "/restaurants", title: "맛집 추천", desc: "필터 · 영업시간 표시" },
  { href: "/attractions", title: "관광지 정보", desc: "리뷰 · 추천 방문 시간" },
  { href: "/stays", title: "숙박 검색", desc: "호텔·료칸·게하" },
  { href: "/settings/notifications", title: "카카오 알림", desc: "당일 일정 자동 발송" },
] as const;
