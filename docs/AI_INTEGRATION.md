# AI 모델 연동 가이드

## 환경 변수

```
AI_SERVICE_BASE_URL=https://your-ai-api.example.com
AI_SERVICE_API_KEY=optional-bearer-token
```

## 엔드포인트 스펙

### POST `/itinerary/generate`

**Request** (`ItineraryGenerateRequest`):

```json
{
  "region": "OSAKA_KYOTO",
  "origin": "인천공항",
  "startDate": "2026-06-01",
  "endDate": "2026-06-04",
  "budgetKrw": 1500000,
  "travelers": 2,
  "preferences": ["맛집", "온천"]
}
```

**Response** (`ItineraryGenerateResponse`):

```json
{
  "title": "오사카·교토 2인 여행",
  "days": [
    {
      "dayIndex": 1,
      "date": "2026-06-01",
      "items": [
        {
          "placeName": "오사카성",
          "startTime": "10:00",
          "endTime": "12:00",
          "transport": "지하철"
        }
      ]
    }
  ],
  "attractions": [
    {
      "id": "1",
      "name": "오사카성",
      "lat": 34.6873,
      "lng": 135.5262,
      "rating": 4.5
    }
  ]
}
```

### POST `/chat`

**Request**: `{ "sessionId": "...", "message": "...", "region": "TOKYO" }`  
**Response**: `{ "sessionId": "...", "reply": "...", "suggestedQuestions": ["..."] }`

### POST `/accommodations/search`

Query body: `AccommodationSearchRequest` → `AccommodationResult[]`

### POST `/restaurants/search`

Query body: `RestaurantSearchRequest` → `RestaurantResult[]`

### POST `/attractions`

Body: `{ "region": "SAPPORO" }` → `AttractionResult[]`

## 지역 코드

- `OSAKA_KYOTO` — 오사카·교토 통합
- `FUKUOKA`
- `TOKYO`
- `SAPPORO`

타입 정의는 `src/lib/ai/types.ts`를 단일 소스로 사용하세요.
