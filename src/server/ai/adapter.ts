// src/server/ai/adapter.ts
import { callGemini } from "./gemini";
import { detect } from "./detector";
import { searchRag } from "./rag";
import { buildSystemPrompt, buildUserPrompt, buildChatHistory } from "./prompt";
import { generateTravelPlan } from "./planner";

import type {
  AccommodationResult,
  AccommodationSearchRequest,
  AttractionResult,
  ChatRequest,
  ChatResponse,
  ItineraryGenerateRequest,
  ItineraryGenerateResponse,
  RestaurantResult,
  RestaurantSearchRequest,
} from "./types";
import type { JapanRegionId } from "@/shared/lib/constants";
import { MOCK_ATTRACTIONS } from "@/features/attractions/server/mock-data";
import { enrichAttraction } from "@/features/attractions/server/details";


const AI_BASE = process.env.AI_SERVICE_BASE_URL ?? "";
const AI_KEY = process.env.AI_SERVICE_API_KEY ?? "";


async function callAi<T>(path: string, body: unknown): Promise<T | null> {
  if (!AI_BASE) return null;
  try {
    const res = await fetch(`${AI_BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(AI_KEY ? { Authorization: `Bearer ${AI_KEY}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// Gemini 챗봇 구현

async function geminiChat(req: ChatRequest): Promise<ChatResponse> {
  try {
    const message = req.message;

    // 1. 지역 + 주제 + 기간 감지
    const detected = detect(message);

    // 2. 이전 대화 히스토리 — chat.service.ts가 tripContext.history로 전달한 값 사용 (DB 중복 조회 방지)
    const historyMessages: { role: string; content: string }[] =
      (req.tripContext?.history as { role: string; content: string }[]) ?? [];

    // 3. RAG 검색

    let ragResults: Awaited<ReturnType<typeof searchRag>> = [];
    if (detected.region) {
      ragResults = await searchRag(message, detected.region, detected.themes, 5);
    }

    // 4. 프롬프트 빌드
    const systemPrompt = buildSystemPrompt(detected.region, detected.themes);
    const userPrompt = buildUserPrompt(message, ragResults, detected.days);

    // 5. 대화 히스토리 변환
    const chatHistory = buildChatHistory(historyMessages);

    // 6 & 7. 일정 생성 요청 분기 처리
    let reply = "";
    let itinerary = null;

    if (detected.isItineraryRequest && detected.region) {
      console.log(`[엔진 분기] 일정 생성 요청 감지 -> planner.ts 엔진 구동`);


      const candidates = ragResults.flatMap((res: any) =>
        res.items.map((item: any) => ({
          id: item.id || "temp-id",
          name: item.name,
          nameKo: item.name,
          theme: res.theme,
          description: item.description,
          address: item.location || null,
          tags: item.tags,
        }))
      );

      try {
        const generatedPlan = await generateTravelPlan({
          region: detected.region,
          durationDays: detected.days || 3,
          userPreferences: detected.themes,
          candidates: candidates,
        });

        itinerary = generatedPlan;
        reply = `${generatedPlan.title}\n\n${generatedPlan.summary}\n\n인터랙티브 타임라인 일정이 하단에 생성되었습니다. 마음에 드시는지 확인해보세요!`;
      } catch (planError) {
        console.error("Structured Planner 가동 실패, 일반 챗으로 우회합니다.", planError);
        reply = await callGemini(systemPrompt, [
          ...chatHistory,
          { role: "user", parts: [{ text: userPrompt }] },
        ]);
      }
    } else {
      reply = await callGemini(systemPrompt, [
        ...chatHistory,
        { role: "user", parts: [{ text: userPrompt }] },
      ]);
    }

    // 8. 추천 질문 생성
    const suggestedQuestions = detected.region
      ? [
          `${detected.region === "TOKYO" ? "도쿄" : detected.region === "OSAKA_KYOTO" ? "오사카·교토" : detected.region === "SAPPORO" ? "삿포로" : "후쿠오카"} 맛집 추천해줘`,
          "예산은 얼마나 필요해?",
          "교통편 알려줘",
        ]
      : [
          "도쿄 3박 4일 일정 짜줘",
          "오사카 맛집 추천해줘",
          "삿포로 힐링 여행 코스 알려줘",
        ];


    return {
      sessionId: req.sessionId ?? "new-session",
      reply,
      suggestedQuestions,
      ...(itinerary && { itinerary }),
    };
  } catch (error) {
    console.error("Gemini 챗봇 오류:", error);
    return {
      sessionId: req.sessionId ?? "error-session",
      reply: "죄송합니다. 일시적인 오류가 발생했습니다. 다시 시도해주세요.",
      suggestedQuestions: [],
    };
  }
}


function mockItinerary(req: ItineraryGenerateRequest): ItineraryGenerateResponse {
  const regionLabel: Record<JapanRegionId, string> = {
    OSAKA_KYOTO: "오사카·교토",
    FUKUOKA: "후쿠오카",
    TOKYO: "도쿄",
    SAPPORO: "삿포로",
  };

  const attractions = (MOCK_ATTRACTIONS as Record<string, any>)[req.region] ?? [];

  return {
    title: `${regionLabel[req.region]} ${req.travelers}인 여행`,
    days: [
      {
        dayIndex: 1,
        date: req.startDate,
        items: [
          { placeName: "공항 → 시내 이동", startTime: "10:00", transport: "전철" },
          { placeName: "지역 대표 관광지", startTime: "14:00", endTime: "18:00" },
        ],
      },
    ],
    attractions: attractions,
  };
}


function mockRestaurants(region: JapanRegionId): RestaurantResult[] {
  return [
    {
      id: "r1",
      name: region === "TOKYO" ? "츠키지 스시" : "현지 인기 라멘",
      cuisine: "일식",
      rating: 4.6,
      distanceKm: 0.8,
      avgPriceKrw: 25000,
      hours: "11:00-21:00",
      reservationRequired: true,
    },
    {
      id: "r2",
      name: "이자카야 거리 맛집",
      cuisine: "이자카야",
      rating: 4.3,
      distanceKm: 1.2,
      avgPriceKrw: 18000,
      hours: "17:00-24:00",
      reservationRequired: false,
    },
  ];
}

function mockStays(): AccommodationResult[] {
  return [
    {
      id: "s1",
      name: "시내 비즈니스 호텔",
      type: "HOTEL",
      priceKrw: 120000,
      rating: 4.4,
      bookingUrl: "https://example.com/book/hotel",
    },
    {
      id: "s2",
      name: "전통 료칸",
      type: "RYOKAN",
      priceKrw: 280000,
      rating: 4.8,
      bookingUrl: "https://example.com/book/ryokan",
    },
  ];
}

export const aiAdapter = {
  async generateItinerary(req: ItineraryGenerateRequest) {
    try {
      const start = new Date(req.startDate);
      const end = new Date(req.endDate);
      const durationDays = Math.max(
        1,
        Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      );
      const themes = (req.preferences ?? []) as import("./detector").Theme[];
      const ragResults = await searchRag(
        req.region + " 여행 일정",
        req.region as import("./detector").Region,
        themes,
        8
      );
      const candidates = ragResults.flatMap((res: any) =>
        res.items.map((item: any) => ({
          id: item.id || "temp-id",
          name: item.name,
          nameKo: item.name,
          theme: res.theme,
          description: item.description,
          address: item.location || null,
          tags: item.tags,
        }))
      );
      const plan = await generateTravelPlan({
        region: req.region,
        durationDays,
        userPreferences: themes.length > 0 ? themes : ["sightseeing", "food"],
        candidates,
      });
      const days: ItineraryGenerateResponse["days"] = plan.schedule.map((s: any) => {
        const date = new Date(start);
        date.setDate(start.getDate() + s.day - 1);
        return {
          dayIndex: s.day,
          date: date.toISOString().split("T")[0],
          items: s.places.map((p: any) => ({
            placeId: p.placeId,
            placeName: p.name,
            startTime: p.recommendedTime?.split(" - ")[0] ?? "",
            endTime: p.recommendedTime?.split(" - ")[1] ?? "",
            notes: p.contextualMemo,
          })),
        };
      });
      return { title: plan.title, days, attractions: [] };
    } catch (e) {
      console.error("[generateItinerary] AI 실패, mock으로 폴백:", e);
      return mockItinerary(req);
    }
  },

  async searchAccommodations(req: AccommodationSearchRequest) {
    return (
      (await callAi<AccommodationResult[]>("/accommodations/search", req)) ??
      mockStays()
    );
  },


  async chat(req: ChatRequest) {
    return await geminiChat(req);
  },

  async searchRestaurants(req: RestaurantSearchRequest) {
    return (
      (await callAi<RestaurantResult[]>("/restaurants/search", req)) ??
      mockRestaurants(req.region)
    );
  },

  async getAttractions(region: JapanRegionId) {
    const fromAi = await callAi<AttractionResult[]>("/attractions", { region });
    const items = fromAi ?? ((MOCK_ATTRACTIONS as Record<string, any>)[region] ?? []);

    return items.map((a: any) => enrichAttraction(a));
  },
};