import { GoogleGenerativeAI } from "@google/generative-ai";
// 만약 프로젝트 내부에서 JapanRegion 에넘 타입을 쓰고 싶다면 아래처럼 import 하세요.
// import { JapanRegion } from "@prisma/client";

const apiKey = process.env.GEMINI_API_KEY ?? "";
const genAI = new GoogleGenerativeAI(apiKey);

// 1. 방식 A 적용: 타입을 any로 우회하여 TypeScript strict 검사 우회
//    내부 모든 type 필드는 대문자 문자열("OBJECT", "STRING" 등)로 선언
const travelPlanSchema: any = {
  type: "OBJECT",
  properties: {
    title: { 
      type: "STRING", 
      description: "여행 일정을 대표하는 멋진 제목 (예: '맛과 힐링의 2박 3일 오사카 감성 여행')" 
    },
    totalDays: { 
      type: "INTEGER", 
      description: "총 여행 일수" 
    },
    summary: { 
      type: "STRING", 
      description: "이 일정의 전반적인 특징과 추천 컨셉 요약 설명" 
    },
    schedule: {
      type: "ARRAY",
      description: "일차별 세부 일정 배열",
      items: {
        type: "OBJECT",
        properties: {
          day: { type: "INTEGER", description: "여행 몇 일차인지 (1, 2, 3...)" },
          dayTheme: { type: "STRING", description: "해당 일차의 핵심 테마 (예: '도톤보리 먹방과 신사이바시 쇼핑 투어')" },
          places: {
            type: "ARRAY",
            description: "해당 일차에 방문할 장소 리스트 (동선 순서대로 배열)",
            items: {
              type: "OBJECT",
              properties: {
                placeId: { 
                  type: "STRING", 
                  description: "제공된 후보 장소 데이터셋에 존재하는 Prisma Place 모델의 고유 ID(id)" 
                },
                name: { type: "STRING", description: "장소 이름 (가급적 한국어 이름 사용)" },
                recommendedTime: { 
                  type: "STRING", 
                  description: "추천 방문 시간대 (예: '10:00 - 12:00' 또는 '점심 식사')" 
                },
                visitDuration: {
                  type: "STRING",
                  description: "체류 예상 시간 (예: '1시간 30분')"
                },
                contextualMemo: { 
                  type: "STRING", 
                  description: "사용자의 취향과 이 장소의 특징(tags, description)을 고려하여, 왜 이 타이밍에 이곳을 추천하는지 설명하는 커스텀 메모" 
                }
              },
              required: ["placeId", "name", "recommendedTime", "contextualMemo"]
            }
          }
        },
        required: ["day", "dayTheme", "places"]
      }
    }
  },
  required: ["title", "totalDays", "summary", "schedule"]
};

// 2. Prisma의 Place 모델 구조에 맞춘 입력 인터페이스 선언
interface CandidatePlace {
  id: string;
  name: string;
  nameKo: string | null;
  theme: string;
  description: string;
  address: string | null;
  tags: string[];
}

interface GeneratePlanInput {
  region: string;           // JapanRegion 에넘값 분기 (예: 'OSAKA_KYOTO', 'TOKYO')
  durationDays: number;     // 기간
  userPreferences: string[]; // 사용자가 선택한 취향 키워드 리스트
  candidates: CandidatePlace[]; // rag.ts가 DB(Prisma)에서 꺼내온 장소 리스트
}

/**
 * 사용자 맞춤형 여행 일정을 생성하는 엔진 함수
 */
export async function generateTravelPlan(input: GeneratePlanInput) {
  const { region, durationDays, userPreferences, candidates } = input;

  const systemInstruction = `
    당신은 일본 여행에 특화된 대한민국 최고의 맞춤형 여행 플래너 AI 가이드입니다.
    사용자의 취향과 RAG를 통해 데이터베이스에서 엄선된 '후보 장소 리스트'만을 100% 활용하여 최적의 동선과 테마를 가진 완벽한 여행 일정을 설계해야 합니다.
    반드시 주어진 스키마(JSON) 구조를 철저히 지켜 응답하세요.
  `;

  const userPrompt = `
    [여행 기본 정보]
    - 여행 지역: ${region}
    - 여행 기간: ${durationDays}박 ${durationDays}일
    - 사용자 취향 선호도: ${userPreferences.join(", ")}

    [데이터베이스 기반 추천 후보 장소들 (Prisma Place 모델 결과 데이터)]
    ${JSON.stringify(candidates, null, 2)}

    [요구사항]
    1. 반드시 위에 제공된 [데이터베이스 기반 추천 후보 장소들] 안에 있는 장소들(id가 일치해야 함)만을 조합하여 일정을 구성하세요. 리스트에 없는 장소를 임의로 지어내거나 할루시네이션을 일으키면 절대 안 됩니다.
    2. 장소 이름 표기 시 nameKo(한국어 이름)가 존재하면 가급적 한국어 이름을 우선으로 사용하세요.
    3. ${durationDays}일의 일정을 채우기에 후보 장소가 부족하다면, 제공된 장소 안에서만 알차게 배정하되 동선이 꼬이지 않게 순서를 조율하세요.
    4. 각 장소의 'contextualMemo'에는 사용자의 취향(${userPreferences.join(", ")})과 해당 장소의 설명(description) 및 태그(tags)를 엮어서 "왜 이 타이밍에 여기를 방문해야 하는지" 친절하게 작성하세요.
    5. 하루 일정이 물 흐르듯 자연스럽게 이어지도록 동선(아침 -> 점심 -> 오후 -> 저녁)을 배치하세요.
  `;

  try {
    const geminiModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: {
        parts: [{ text: systemInstruction }],
        role: "system",
      },
    });

    const result = await geminiModel.generateContent({
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: travelPlanSchema,
        temperature: 0.3,
      }
    });

    const responseText = result.response.text();
    
    if (!responseText) {
      throw new Error("Gemini로부터 일정 응답을 받지 못했습니다.");
    }

    // 결과 구조화 JSON 파싱 후 반환
    const structuredPlan = JSON.parse(responseText);
    return structuredPlan;

  } catch (error) {
    console.error("일정 생성 엔진(planner.ts) 오류 발생:", error);
    throw error;
  }
}