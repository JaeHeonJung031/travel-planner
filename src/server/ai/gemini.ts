import { GoogleGenerativeAI } from "@google/generative-ai";

// 모델 상수 (맨 위에!)
export const CHAT_MODEL = "gemini-2.5-flash";
export const TAGGER_MODEL = "gemini-2.5-flash-lite";

const apiKey = process.env.GEMINI_API_KEY ?? "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function callGemini(
  systemPrompt: string,
  messages: { role: "user" | "model"; parts: { text: string }[] }[],
  model: string = CHAT_MODEL  // ← 기본값 추가
): Promise<string> {
  try {
    const geminiModel = genAI.getGenerativeModel({
      model: model,  // ← 이것도 수정
      systemInstruction: {
        parts: [{ text: systemPrompt }],
        role: "system",
      },
    });

    const chat = geminiModel.startChat({
      history: messages.slice(0, -1),
    });

    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.parts[0].text);
    return result.response.text();
  } catch (error) {
    console.error("Gemini API 호출 실패:", error);
    return "죄송합니다. 일시적인 오류가 발생했습니다. 다시 시도해주세요.";
  }
}