import { genAI, CHAT_MODEL } from "./gemini"; // ← gemini.ts에서 import

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
          dayTheme: { type: "STRING", description: "해당 일차의 핵심 테마" },
          places: {
            type: "ARRAY",
            description: "해당 일차에 방문할 장소 리스트 (동선 순서대로)",
            items: {
              type: "OBJECT",
              properties: {
                placeId: {
                  type: "STRING",
                  description: "Prisma Place 모델의 고유 ID"
                },
                name: { type: "STRING", description: "장소 이름 (한국어 우선)" },
                recommendedTime: {
                  type: "STRING",
                  description: "추천 방문 시간대 (예: '10:00 - 12:00')"
                },
                visitDuration: {
                  type: "STRING",
                  description: "체류 예상 시간 (예: '1시간 30분')"
                },
                contextualMemo: {
                  type: "STRING",
                  description: "왜 이 타이밍에 이곳을 추천하는지 설명하는 커스텀 메모"
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
  region: string;
  durationDays: number;
  userPreferences: string[];
  candidates: CandidatePlace[];
}

export async function generateTravelPlan(input: GeneratePlanInput) {
  const { region, durationDays, userPreferences, candidates } = input;

  const systemInstruction = `
    당신은 일본 여행에 특화된 대한민국 최고의 맞춤형 여행 플래너 AI 가이드입니다.
    사용자의 취향과 RAG를 통해 데이터베이스에서 엄선된 '후보 장소 리스트'만을 100% 활용하여
    최적의 동선과 테마를 가진 완벽한 여행 일정을 설계해야 합니다.
    반드시 주어진 스키마(JSON) 구조를 철저히 지켜 응답하세요.
  `;

  const userPrompt = `
    [여행 기본 정보]
    - 여행 지역: ${region}
    - 여행 기간: ${durationDays - 1}박 ${durationDays}일
    - 사용자 취향 선호도: ${userPreferences.join(", ")}

    [데이터베이스 기반 추천 후보 장소들 (Prisma Place 모델 결과 데이터)]
    ${JSON.stringify(candidates, null, 2)}

    [요구사항]
    1. 반드시 위에 제공된 후보 장소들 안에 있는 장소들만 조합하여 일정을 구성하세요.
       리스트에 없는 장소를 임의로 지어내거나 할루시네이션을 일으키면 절대 안 됩니다.
    2. 장소 이름 표기 시 nameKo(한국어 이름)가 존재하면 한국어 이름을 우선으로 사용하세요.
    3. 반드시 ${durationDays}일 전체 일정을 빠짐없이 채워야 합니다.
       Day 1부터 Day ${durationDays}까지 모두 작성하세요.
    4. 각 Day마다 반드시 최소 3개 이상의 장소를 배정하세요.
       하루에 1~2개만 배정하는 것은 절대 안 됩니다.
    5. 각 Day에는 반드시 식사 관련 장소(맛집, 카페, 음식점)를 최소 1개 이상 포함하세요.
       후보 장소에 식당이 없으면 해당 지역 유명 맛집을 contextualMemo에서 자연스럽게 언급하세요.
    6. 각 장소의 'contextualMemo'에는 사용자의 취향(${userPreferences.join(", ")})과
       해당 장소의 설명 및 태그를 엮어서 왜 이 타이밍에 방문해야 하는지 친절하게 작성하세요.
    7. 하루 일정이 물 흐르듯 자연스럽게 이어지도록 동선(아침→점심→오후→저녁)을 배치하세요.
    8. 마지막 응답 summary에 반드시 이런 문장을 포함하세요:
       "혹시 각 일차별로 근처 맛집이나 카페 추가 추천이 필요하신가요? 😊"
`;  

  try {
    const geminiModel = genAI.getGenerativeModel({
      model: CHAT_MODEL, // ← 상수 사용
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

    return JSON.parse(responseText);

  } catch (error) {
    console.error("일정 생성 엔진(planner.ts) 오류 발생:", error);
    throw error;
  }
}