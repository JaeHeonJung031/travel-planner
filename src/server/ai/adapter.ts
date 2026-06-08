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
import { callGemini } from "./gemini";
import { detect } from "./detector";
import { searchRag, ragToText } from "./rag";
import { buildSystemPrompt, buildUserPrompt, buildChatHistory } from "./prompt";
import { prisma } from "@/server/db/prisma";

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

    // 2. 이전 대화 히스토리 불러오기
    let historyMessages: { role: string; content: string }[] = [];
    if (req.sessionId) {
      const dbMessages = await prisma.chatMessage.findMany({
        where: { sessionId: req.sessionId },
        orderBy: { createdAt: "asc" },
        take: 20, // 최근 20개
      });
      historyMessages = (dbMessages as { role: string; content: string }[]).map((m) => ({
  role: m.role,
  content: m.content,
      }));
    }

    // 3. RAG 검색
    let ragResults: ReturnType<typeof searchRag> = [];
    if (detected.region) {
      ragResults = searchRag(
        message,
        detected.region,
        detected.themes,
        5
      );
    }

    // 4. 프롬프트 빌드
    const systemPrompt = buildSystemPrompt(detected.region, detected.themes);
    const userPrompt = buildUserPrompt(message, ragResults, detected.days);

    // 5. 대화 히스토리 변환
    const chatHistory = buildChatHistory(historyMessages);

    // 6. Gemini 호출
    const reply = await callGemini(systemPrompt, [
      ...chatHistory,
      { role: "user", parts: [{ text: userPrompt }] },
    ]);

    // 7. 일정 생성 요청이면 JSON 파싱 시도
    let itinerary = null;
    if (detected.isItineraryRequest) {
      try {
        const jsonMatch = reply.match(/```json\n?([\s\S]*?)\n?```/);
        if (jsonMatch) {
          itinerary = JSON.parse(jsonMatch[1]);
        }
      } catch {
        // JSON 파싱 실패해도 텍스트 응답은 정상 반환
      }
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
      reply: itinerary
        ? reply.replace(/```json[\s\S]*?```/g, "").trim()
        : reply,
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
    attractions: MOCK_ATTRACTIONS[req.region] ?? [],
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
    return (
      (await callAi<ItineraryGenerateResponse>("/itinerary/generate", req)) ??
      mockItinerary(req)
    );
  },

  async searchAccommodations(req: AccommodationSearchRequest) {
    return (
      (await callAi<AccommodationResult[]>("/accommodations/search", req)) ??
      mockStays()
    );
  },

  // ← Gemini로 교체!
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
    const items = fromAi ?? (MOCK_ATTRACTIONS[region] ?? []);
    return items.map((a) => enrichAttraction(a));
  },
};