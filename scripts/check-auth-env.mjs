import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
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

const fileVars = readEnvFile(envPath);
const secret = process.env.AUTH_SECRET || fileVars.AUTH_SECRET;
const invalid =
  !secret ||
  secret.includes("openssl") ||
  secret.includes("로 생성") ||
  secret.startsWith("GOCSPX-");

let failed = false;

if (!existsSync(envPath)) {
  console.error("\n[오류] 프로젝트 루트에 .env 파일이 없습니다.");
  console.error("       .env.example 을 복사해 .env 를 만든 뒤 값을 채워주세요.\n");
  failed = true;
}

if (invalid) {
  if (!existsSync(envPath)) {
    console.error("\n[오류] AUTH_SECRET 이 비어 있거나 예시 문구입니다.");
    console.error("       .env 파일을 만든 뒤 AUTH_SECRET 을 설정해주세요.\n");
    failed = true;
  } else {
    const generated = randomBytes(32).toString("base64");
    const content = readFileSync(envPath, "utf8");
    const updated = /^AUTH_SECRET=.*$/m.test(content)
      ? content.replace(/^AUTH_SECRET=.*$/m, `AUTH_SECRET="${generated}"`)
      : `${content.trimEnd()}\nAUTH_SECRET="${generated}"\n`;
    writeFileSync(envPath, updated, "utf8");
    console.log("\n[안내] AUTH_SECRET 을 자동 생성해 .env 에 저장했습니다.");
    console.log("       (Google Client Secret 을 AUTH_SECRET 에 넣으면 안 됩니다.)");
    console.log("       배포 환경에서는 직접 안전한 값으로 교체하세요.\n");
  }
}

const googleId = process.env.AUTH_GOOGLE_ID || fileVars.AUTH_GOOGLE_ID;
const googleSecret = process.env.AUTH_GOOGLE_SECRET || fileVars.AUTH_GOOGLE_SECRET;
const exampleVars = existsSync(resolve(root, ".env.example"))
  ? readEnvFile(resolve(root, ".env.example"))
  : {};

if (googleId && googleSecret) {
  if (
    exampleVars.AUTH_GOOGLE_ID &&
    exampleVars.AUTH_GOOGLE_SECRET &&
    googleId === exampleVars.AUTH_GOOGLE_ID &&
    googleSecret === exampleVars.AUTH_GOOGLE_SECRET
  ) {
    console.warn(
      "\n[경고] AUTH_GOOGLE_ID/SECRET 이 .env.example 과 동일합니다.",
    );
    console.warn(
      "       Google Cloud Console에서 본인 OAuth 클라이언트 Secret을 복사해 .env 에 넣으세요.\n",
    );
  } else {
    console.log("[OK] Google OAuth 환경 변수 설정됨");
  }
} else {
  console.warn("\n[경고] AUTH_GOOGLE_ID 또는 AUTH_GOOGLE_SECRET 이 비어 있습니다.");
  console.warn("       구글 로그인을 쓰려면 .env 에 값을 채우세요.\n");
}

if (failed) process.exit(1);

console.log("[OK] AUTH_SECRET 설정됨");
