import { prisma } from "@/server/db/prisma";

const KAKAO_TOKEN_URL = "https://kauth.kakao.com/oauth/token";
const KAKAO_MEMO_SEND_URL = "https://kapi.kakao.com/v2/api/talk/memo/default/send";

type KakaoAccountRow = {
  id: string;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: number | null;
};

function getKakaoClientConfig() {
  const clientId = process.env.AUTH_KAKAO_ID;
  const clientSecret = process.env.AUTH_KAKAO_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("AUTH_KAKAO_ID 또는 AUTH_KAKAO_SECRET 이 없습니다.");
  }
  return { clientId, clientSecret };
}

async function refreshKakaoAccessToken(account: KakaoAccountRow): Promise<string> {
  const { clientId, clientSecret } = getKakaoClientConfig();
  if (!account.refresh_token) {
    throw new Error("카카오 refresh_token 이 없습니다. 카카오로 다시 로그인하세요.");
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: account.refresh_token,
  });

  const res = await fetch(KAKAO_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description ?? data.error ?? "카카오 토큰 갱신 실패");
  }

  const expiresAt = data.expires_in
    ? Math.floor(Date.now() / 1000) + data.expires_in
    : null;

  await prisma.account.update({
    where: { id: account.id },
    data: {
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? account.refresh_token,
      expires_at: expiresAt,
    },
  });

  return data.access_token;
}

/** 만료 60초 전이면 refresh */
export async function getValidKakaoAccessToken(account: KakaoAccountRow): Promise<string> {
  if (!account.access_token) {
    return refreshKakaoAccessToken(account);
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (account.expires_at && account.expires_at <= nowSec + 60) {
    return refreshKakaoAccessToken(account);
  }

  return account.access_token;
}

export async function sendKakaoTalkMemo(accessToken: string, text: string) {
  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";
  const trimmed = text.length > 900 ? `${text.slice(0, 897)}...` : text;

  const template = {
    object_type: "text",
    text: trimmed,
    link: {
      web_url: baseUrl,
      mobile_web_url: baseUrl,
    },
    button_title: "일정 보기",
  };

  const body = new URLSearchParams({
    template_object: JSON.stringify(template),
  });

  const res = await fetch(KAKAO_MEMO_SEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = (await res.json()) as { result_code?: number; msg?: string };

  if (!res.ok || data.result_code !== 0) {
    throw new Error(data.msg ?? `카카오톡 발송 실패 (${res.status})`);
  }

  return data;
}
