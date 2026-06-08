import { NextResponse } from "next/server";
import { fetchExchangeRate } from "@/features/budget/server/exchange-rate";

export async function GET() {
  const rate = await fetchExchangeRate();
  return NextResponse.json(rate);
}
