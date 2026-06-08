const FALLBACK_RATE = 0.11;

export type ExchangeRate = {
  krwToJpy: number;
  jpyToKrw: number;
  updatedAt: string;
  source: "api" | "fallback";
};

export async function fetchExchangeRate(): Promise<ExchangeRate> {
  const apiKey = process.env.EXCHANGE_RATE_API_KEY;

  if (!apiKey) {
    return {
      krwToJpy: FALLBACK_RATE,
      jpyToKrw: 1 / FALLBACK_RATE,
      updatedAt: new Date().toISOString(),
      source: "fallback",
    };
  }

  try {
    const res = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/pair/KRW/JPY`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) throw new Error("rate fetch failed");
    const data = (await res.json()) as { conversion_rate: number };
    const krwToJpy = data.conversion_rate;
    return {
      krwToJpy,
      jpyToKrw: 1 / krwToJpy,
      updatedAt: new Date().toISOString(),
      source: "api",
    };
  } catch {
    return {
      krwToJpy: FALLBACK_RATE,
      jpyToKrw: 1 / FALLBACK_RATE,
      updatedAt: new Date().toISOString(),
      source: "fallback",
    };
  }
}

export function krwToJpy(amountKrw: number, rate: ExchangeRate) {
  return Math.round(amountKrw * rate.krwToJpy);
}

export function jpyToKrw(amountJpy: number, rate: ExchangeRate) {
  return Math.round(amountJpy * rate.jpyToKrw);
}
