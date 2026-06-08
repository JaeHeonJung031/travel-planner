import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const envPath = resolve(root, ".env");

function readEnvFile(path) {
  if (!existsSync(path)) return {};
  const vars = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    vars[key] = val;
  }
  return vars;
}

const vars = readEnvFile(envPath);
const id = process.env.AUTH_KAKAO_ID || vars.AUTH_KAKAO_ID || "";
const secret = process.env.AUTH_KAKAO_SECRET || vars.AUTH_KAKAO_SECRET || "";

console.log("\n=== Kakao OAuth .env 점검 ===\n");

if (!existsSync(envPath)) {
  console.error("[오류] .env 파일이 없습니다.\n");
  process.exit(1);
}

let ok = true;

if (!id) {
  console.error("[오류] AUTH_KAKAO_ID 가 비어 있습니다. (REST API 키)");
  ok = false;
} else {
  console.log(`[OK] AUTH_KAKAO_ID (${id.slice(0, 8)}...)`);
}

if (!secret) {
  console.error("[오류] AUTH_KAKAO_SECRET 이 비어 있습니다. (카카오 로그인 > 보안 > Client Secret)");
  ok = false;
} else {
  console.log(`[OK] AUTH_KAKAO_SECRET (길이 ${secret.length}자)`);
}

console.log(`
카카오 개발자 콘솔 설정:
1. https://developers.kakao.com/console/app
2. 앱 선택 → 제품 설정 → 카카오 로그인 활성화
3. [앱] > [플랫폼 키] > REST API 키 > Redirect URI 에 아래를 "그대로" 등록
   http://localhost:3000/api/auth/callback/kakao
   ※ 끝이 kaka 가 아니라 kakao (알파벳 o) 입니다!
4. 사이트 도메인: http://localhost:3000
5. 동의 항목(필수): 닉네임, 프로필 사진, 카카오톡 메시지 전송(talk_message) — 활성화
6. 로그인 후 /settings/notifications 에서 「지금 카카오톡으로 테스트 발송」
7. .env
   AUTH_KAKAO_ID="REST API 키"
   AUTH_KAKAO_SECRET="Client Secret"
   CRON_SECRET="임의 문자열" (매일 자동 발송용)
`);

process.exit(ok ? 0 : 1);
