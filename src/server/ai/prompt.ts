import type { Region, Theme } from "./detector";
import type { RagResult } from "./rag";
import { ragToText } from "./rag";

const REGION_LABEL: Record<Region, string> = {
  TOKYO: "도쿄",
  OSAKA_KYOTO: "오사카·교토",
  SAPPORO: "삿포로",
  FUKUOKA: "후쿠오카",
};

const THEME_LABEL: Record<Theme, string> = {
  healing: "힐링/온천",
  shopping: "쇼핑",
  sightseeing: "관광명소",
  otaku: "덕질/애니메이션",
  food: "맛집/음식",
  culture: "문화/역사",
};

// 시스템 프롬프트 생성
export function buildSystemPrompt(
  region: Region | null,
  themes: Theme[]
): string {
  const regionText = region ? REGION_LABEL[region] : "일본 전 지역";
  const themeText =
    themes.length > 0
      ? themes.map((t) => THEME_LABEL[t]).join(", ")
      : "전반적인 여행";

  return `
당신은 일본 여행 전문 AI 플래너입니다.
담당 지역: ${regionText}
전문 분야: ${themeText}

## 역할
- 여행자의 질문에 친절하고 상세하게 답변합니다
- 실제 여행에 도움이 되는 구체적인 정보를 제공합니다
- 일정 생성 요청 시 JSON 형식으로 구조화된 일정을 만듭니다
- 대화 맥락을 기억하고 이전 내용을 참고해 답변합니다

## 답변 규칙
1. 항상 한국어로 답변합니다
2. 모르는 정보는 솔직하게 모른다고 합니다
3. 일본 여행과 무관한 질문은 정중히 거절합니다
4. 구체적인 장소명, 가격, 교통편을 포함합니다
5. 이동 동선을 고려해 효율적인 일정을 제안합니다

## 일정 생성 시 출력 형식
일정 생성 요청이면 반드시 아래 JSON 형식으로 응답하세요:

\`\`\`json
{
  "type": "itinerary",
  "title": "여행 제목",
  "region": "지역코드 (TOKYO/OSAKA_KYOTO/SAPPORO/FUKUOKA)",
  "days": [
    {
      "dayIndex": 1,
      "theme": "이 날의 테마",
      "items": [
        {
          "placeName": "장소명",
          "startTime": "09:00",
          "endTime": "11:00",
          "transport": "이동수단",
          "notes": "설명 및 팁"
        }
      ]
    }
  ]
}
\`\`\`

일반 질문이면 JSON 없이 자연스럽게 답변하세요.
`.trim();
}

// 최종 프롬프트 조립
export function buildUserPrompt(
  userMessage: string,
  ragResults: RagResult[],
  days: number | null
): string {
  let prompt = "";

  // RAG 데이터 주입
  const ragText = ragToText(ragResults);
  if (ragText) {
    prompt += ragText + "\n\n";
  }

  // 기간 정보 주입
  if (days) {
    prompt += `여행 기간: ${days}일\n\n`;
  }

  // 사용자 메시지
  prompt += `사용자 질문: ${userMessage}`;

  return prompt;
}

// 대화 히스토리 → Gemini 형식 변환
export function buildChatHistory(
  messages: { role: string; content: string }[]
): { role: "user" | "model"; parts: { text: string }[] }[] {
  return messages.map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));
}