/**
 * 로컬 개발용: 매 분 카카오 일정 cron API 호출
 * dev 서버(start.bat)가 켜져 있어야 합니다.
 * start.bat 이 CRON_SECRET 이 있으면 이 스크립트를 백그라운드로 함께 실행합니다.
 *
 * 수동: npm run cron:local
 */
import { readFileSync, existsSync } from "node:fs";
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
const secret = process.env.CRON_SECRET || fileVars.CRON_SECRET;
const baseUrl =
  process.env.CRON_BASE_URL ||
  process.env.AUTH_URL ||
  fileVars.AUTH_URL ||
  "http://localhost:3000";

if (!secret || secret.includes("원하는_긴_랜덤")) {
  console.error("\n[오류] .env 에 CRON_SECRET 을 실제 랜덤 문자열로 설정하세요.");
  console.error("       예: PowerShell");
  console.error('       [Convert]::ToBase64String((1..32|%{Get-Random -Max 256}))\n');
  process.exit(1);
}

async function tick() {
  const kstNow = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/cron/kakao-schedule`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    const body = await res.json().catch(() => ({}));
    if (res.status === 403) {
      console.error(`[${kstNow}] 403 Forbidden — CRON_SECRET 이 서버 .env 와 다릅니다. dev 서버 재시작 후 다시 시도.`);
      return;
    }
    const line = `[${kstNow}] ${res.status} time=${body.time ?? "?"} sent=${body.sent ?? 0}`;
    if (body.sent > 0) {
      console.log(`${line} ✓ 발송됨`);
    } else if (body.errors?.length) {
      console.log(`${line} errors=${JSON.stringify(body.errors)}`);
    } else {
      console.log(`${line} (대기 — 설정 시간·알림 ON 일치 시 sent=1)`);
    }
  } catch (e) {
    console.error(
      `[${kstNow}] 연결 실패 — ${baseUrl} 에 dev 서버가 켜져 있는지 확인 (start.bat)`,
    );
    if (e instanceof Error) console.error(`  ${e.message}`);
  }
}

console.log("\n========================================");
console.log("  카카오 일정 알림 — 로컬 Cron (1분마다)");
console.log("========================================");
console.log(`  대상: ${baseUrl}/api/cron/kakao-schedule`);
console.log("  종료: Ctrl+C");
console.log("  설정 시간(한국)에 맞춰 자동 발송됩니다.\n");

await tick();
setInterval(tick, 60_000);
