# NipponTrip — 일본 여행 플래너 AI

오사카·교토(통합), 후쿠오카, 도쿄, 삿포로 지역을 지원하는 **웹/PWA 겸용** 여행 플래너입니다.  
AI 학습 모델 팀과는 `AI_SERVICE_BASE_URL` HTTP API로 연동합니다.

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트/백엔드 | Next.js 16 (App Router), TypeScript, Tailwind CSS |
| 인증 | NextAuth v5 (이메일·Google·Kakao·Naver) |
| DB | PostgreSQL + Prisma |
| PWA | `public/manifest.json` |
| 드래그 앤 드롭 | @dnd-kit |

## 기능 매핑 (과제 11항목)

| # | 기능 | 경로 |
|---|------|------|
| 1 | 여행 체크리스트 | `/checklist` |
| 2 | 소셜 로그인 + 대화 세션 유지 | `/login`, `/chat` |
| 3 | 카카오 당일 일정 알림 | `/settings/notifications`, `GET /api/cron/kakao-schedule` |
| 4 | 예산 관리·환율 | `/budget` |
| 5 | 회원가입·로그인·탈퇴 | `/register`, `/login`, `/profile` |
| 6 | 맛집 추천 | `/restaurants` |
| 7 | 일정 저장·공유·동행자 | `/trips`, `/share/[token]` |
| 8 | 숙박 검색 (AI 연동) | `/stays` |
| 9 | 일정 자동 생성·DnD | `/planner` |
| 10 | AI 챗봇 | `/chat` |
| 11 | 관광지 정보 | `/attractions` |

## 시작하기

```bash
cp .env.example .env
# DATABASE_URL, AUTH_SECRET 등 설정

npm install
npx prisma db push
npm run dev
```

## AI 팀 연동 계약

`src/lib/ai/adapter.ts`가 외부 AI 서버를 호출합니다. 미설정 시 목(mock) 데이터를 반환합니다.

| 메서드 | AI 서버 경로 | 설명 |
|--------|--------------|------|
| POST | `/itinerary/generate` | 일정 생성 |
| POST | `/chat` | 챗봇 응답 |
| POST | `/accommodations/search` | 숙소 검색 |
| POST | `/restaurants/search` | 맛집 검색 |
| POST | `/attractions` | 관광지 목록 |

요청/응답 타입: `src/lib/ai/types.ts`

프록시 API: `/api/ai/*`

## 카카오 일정 알림 (Cron)

Vercel Cron 등에서 매 분 호출:

```
GET /api/cron/kakao-schedule
Authorization: Bearer {CRON_SECRET}
```

`NotificationSetting.notifyTime`과 일치하는 사용자에게 당일 일정을 발송합니다.

## 앱(네이티브) 확장

현재 PWA로 모바일 설치가 가능합니다. 네이티브 앱이 필요하면 **Capacitor** 또는 **Expo WebView**로 이 Next.js 빌드를 감싸면 됩니다.

## 팀 분업 제안

- **프론트/백엔드**: 본 레포 (인증, CRUD, UI)
- **AI**: FastAPI 등 별도 서버 → `AI_SERVICE_BASE_URL` 연결
- **인프라**: PostgreSQL(Supabase/Neon), OAuth 키, 카카오 비즈니스 채널
