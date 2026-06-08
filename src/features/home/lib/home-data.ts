export const POPULAR_DESTINATIONS = [
  {
    id: "TOKYO",
    title: "도쿄",
    desc: "시부야 크로싱, 도쿄타워 등 현대와 전통이 공존하는 메가시티",
    image:
      "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80",
    href: "/planner?region=TOKYO",
  },
  {
    id: "KYOTO",
    title: "교토",
    desc: "아라시야마 대나무숲과 아기자기한 신사들이 가득한 전통 도시",
    image:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80",
    href: "/planner?region=OSAKA_KYOTO",
  },
  {
    id: "OSAKA",
    title: "오사카",
    desc: "도톤보리 글리코상과 맛있는 길거리 음식이 가득한 식도락의 천국",
    image:
      "https://images.unsplash.com/photo-1773841040192-c83fc7a95f8a?auto=format&fit=crop&w=800&q=80",
    href: "/planner?region=OSAKA_KYOTO",
  },
  {
    id: "HOKKAIDO",
    title: "홋카이도",
    desc: "라벤더 밭과 하얀 눈발, 온천을 즐길 수 있는 최고의 자연 휴양지",
    image:
      "https://images.unsplash.com/photo-1542640244-7e672d6cef4e?auto=format&fit=crop&w=800&q=80",
    href: "/planner?region=SAPPORO",
  },
] as const;

export const PLANNER_TIMELINE = [
  {
    day: "1일차 - 도쿄 도착",
    spot: "나리타 공항 ➡️ 숙소 체크인",
    memo: "공항철도 이용, 신주쿠 인근 숙소 이동",
  },
  {
    day: "2일차 - 쇼핑 & 트렌드",
    spot: "시부야 스카이 ➡️ 하라주쿠",
    memo: "오후 4시 전망대 예약 필수, 인생샷 스팟",
  },
  {
    day: "3일차 - 도쿄의 전통",
    spot: "아사쿠사 센소지 ➡️ 아키하바라",
    memo: "전통 인력거 체험 및 굿즈 투어",
  },
] as const;

export const AI_SUGGESTIONS = [
  {
    name: "후시미 이나리",
    desc: "교토 · 무료 입장 · 이른 아침 추천",
    href: "/attractions?region=OSAKA_KYOTO",
  },
  {
    name: "라멘 투어 코스",
    desc: "이치란 · 후쿠오카 스타일 · ★4.8",
    href: "/restaurants",
  },
  {
    name: "삿포로 눈축제 코스",
    desc: "2월 시즌 · 온천+맥주",
    href: "/attractions?region=SAPPORO",
  },
] as const;
