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
const id = process.env.AUTH_GOOGLE_ID || vars.AUTH_GOOGLE_ID || "";
const secret = process.env.AUTH_GOOGLE_SECRET || vars.AUTH_GOOGLE_SECRET || "";

let ok = true;

console.log("\n=== Google OAuth .env 점검 ===\n");

if (!existsSync(envPath)) {
  console.error("[오류] .env 파일이 없습니다.");
  process.exit(1);
}

if (!id) {
  console.error("[오류] AUTH_GOOGLE_ID 가 비어 있습니다.");
  ok = false;
} else {
  const idOk = /^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/.test(id);
  console.log(
    idOk
      ? `[OK] Client ID 형식 (${id.slice(0, 12)}...${id.slice(-20)})`
      : `[경고] Client ID 형식이 이상합니다. Google Console에서 다시 복사하세요.`,
  );
  if (!idOk) ok = false;
}

if (!secret) {
  console.error("[오류] AUTH_GOOGLE_SECRET 이 비어 있습니다.");
  ok = false;
} else {
  const hasSpace = /\s/.test(secret);
  const secretOk = /^GOCSPX-[A-Za-z0-9_-]+$/.test(secret);
  if (hasSpace) {
    console.error("[오류] Secret 앞뒤에 공백/줄바꿈이 있습니다. 따옴표 안 공백을 제거하세요.");
    ok = false;
  } else if (!secretOk) {
    console.warn(
      "[경고] Secret 형식이 GOCSPX- 로 시작하지 않습니다. '클라이언트 보안 비밀번호'를 복사했는지 확인하세요.",
    );
  } else {
    console.log(`[OK] Secret 형식 (GOCSPX-..., 길이 ${secret.length}자)`);
  }
}

if (id && secret && id === secret) {
  console.error("[오류] ID와 Secret이 같습니다. Secret을 잘못 붙여넣었습니다.");
  ok = false;
}

const example = readEnvFile(resolve(root, ".env.example"));
if (
  example.AUTH_GOOGLE_ID &&
  example.AUTH_GOOGLE_SECRET &&
  id === example.AUTH_GOOGLE_ID &&
  secret === example.AUTH_GOOGLE_SECRET
) {
  console.error("[오류] .env.example 과 동일한 키입니다. 본인 Google Cloud 키로 교체하세요.");
  ok = false;
}

console.log(`
다음 단계 (invalid_client 해결):
1. https://console.cloud.google.com/apis/credentials
2. OAuth 클라이언트 ID 목록에서 위 Client ID와 "완전히 같은" 항목 클릭
3. "클라이언트 보안 비밀번호" → 비밀번호 만들기(또는 복사)
4. .env 의 AUTH_GOOGLE_SECRET 만 새 값으로 교체 후 저장
5. 승인된 리디렉션 URI: http://localhost:3000/api/auth/callback/google
6. npm run dev 완전 재시작

참고: invalid_client = Google이 ID+Secret 조합을 거부한 것입니다. DB/Neon 문제가 아닙니다.
`);

process.exit(ok ? 0 : 1);
