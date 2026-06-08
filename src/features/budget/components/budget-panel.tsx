"use client";

import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { BUDGET_CATEGORIES } from "@/shared/lib/constants";
import { TripBudgetPicker, type TripBudgetOption } from "./trip-budget-picker";

type Allocation = { category: string; amountKrw: number };
type Rate = { krwToJpy: number; source: string };

export function BudgetPanel() {
  const [trips, setTrips] = useState<TripBudgetOption[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [totalKrw, setTotalKrw] = useState(0);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [expenses, setExpenses] = useState<{ category: string; amountKrw: number; description?: string }[]>([]);
  const [rate, setRate] = useState<Rate | null>(null);
  const [suggestHint, setSuggestHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [spentInput, setSpentInput] = useState({ category: "FOOD", amountKrw: 0, description: "" });

  async function suggestAllocation(tripId: string, amount?: number) {
    const res = await fetch("/api/budget/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ totalKrw: amount ?? totalKrw, tripId }),
    });
    const data = await res.json();
    if (data.totalKrw) setTotalKrw(data.totalKrw);
    if (data.allocations) setAllocations(data.allocations);
    setSuggestHint(data.hint ?? (data.source === "trip" ? "선택한 일정에 맞춰 배분했습니다." : null));
  }

  async function loadBudget(tripId: string, trip?: TripBudgetOption) {
    const res = await fetch(`/api/budget?tripId=${tripId}`);
    const data = await res.json();

    const tripBudget = trip?.totalBudget ?? 0;
    const nextTotal = data.totalKrw > 0 ? data.totalKrw : tripBudget > 0 ? tripBudget : 2000000;
    setTotalKrw(nextTotal);

    if (data.allocations?.length) {
      setAllocations(data.allocations);
      setSuggestHint(null);
    } else {
      await suggestAllocation(tripId, nextTotal);
    }

    setExpenses(data.expenses ?? []);
  }

  async function selectTrip(tripId: string) {
    setSelectedTripId(tripId);
    const trip = trips.find((t) => t.id === tripId);
    await loadBudget(tripId, trip);
  }

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const [rateRes, tripsRes] = await Promise.all([
        fetch("/api/budget/rate"),
        fetch("/api/trips"),
      ]);

      if (cancelled) return;

      const rateData = await rateRes.json();
      setRate(rateData);

      const tripsData = await tripsRes.json();
      const list: TripBudgetOption[] = tripsData.trips ?? [];
      setTrips(list);

      if (list.length > 0) {
        setSelectedTripId(list[0].id);
        const res = await fetch(`/api/budget?tripId=${list[0].id}`);
        if (cancelled) return;
        const data = await res.json();
        const tripBudget = list[0].totalBudget ?? 0;
        const nextTotal = data.totalKrw > 0 ? data.totalKrw : tripBudget > 0 ? tripBudget : 2000000;
        setTotalKrw(nextTotal);
        if (data.allocations?.length) {
          setAllocations(data.allocations);
        } else {
          const suggestRes = await fetch("/api/budget/suggest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ totalKrw: nextTotal, tripId: list[0].id }),
          });
          if (cancelled) return;
          const suggestData = await suggestRes.json();
          if (suggestData.totalKrw) setTotalKrw(suggestData.totalKrw);
          if (suggestData.allocations) setAllocations(suggestData.allocations);
          setSuggestHint(
            suggestData.hint ??
              (suggestData.source === "trip" ? "선택한 일정에 맞춰 배분했습니다." : null),
          );
        }
        setExpenses(data.expenses ?? []);
      }

      if (!cancelled) setLoading(false);
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  async function saveBudget() {
    if (!selectedTripId) return;
    await fetch("/api/budget", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripId: selectedTripId, totalKrw, allocations, expenses }),
    });
  }

  function updateAllocation(category: string, amountKrw: number) {
    setAllocations((prev) => {
      const exists = prev.some((a) => a.category === category);
      if (exists) {
        return prev.map((a) => (a.category === category ? { ...a, amountKrw } : a));
      }
      return [...prev, { category, amountKrw }];
    });
  }

  const allocatedSum = allocations.reduce((s, a) => s + a.amountKrw, 0);
  const spent = expenses.reduce((s, e) => s + e.amountKrw, 0);
  const remaining = totalKrw - spent;
  const selectedTrip = trips.find((t) => t.id === selectedTripId);

  if (loading) {
    return <p className="text-center text-sm text-slate-500">불러오는 중…</p>;
  }

  return (
    <div className="space-y-4">
      <TripBudgetPicker trips={trips} selectedId={selectedTripId} onSelect={selectTrip} />

      {!selectedTripId ? (
        <Card>
          <p className="text-sm text-slate-500">예산을 설정할 여행을 선택해 주세요.</p>
        </Card>
      ) : (
        <>
          {selectedTrip ? (
            <Card className="border-rose-100 bg-rose-50/40 text-sm text-slate-700">
              <span className="font-medium text-rose-700">{selectedTrip.title}</span>
              {" "}일정에 연결된 예산입니다. 항목별 금액은 직접 수정할 수 있습니다.
            </Card>
          ) : null}

          {rate ? (
            <Card className="text-sm text-slate-600">
              환율 1원 ≈ {rate.krwToJpy.toFixed(4)}엔 ({rate.source === "api" ? "실시간" : "기본값"})
            </Card>
          ) : null}

          <Card className="space-y-2">
            <label className="text-sm font-medium">총 예산 (원)</label>
            <input
              type="number"
              value={totalKrw || ""}
              onChange={(e) => setTotalKrw(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => suggestAllocation(selectedTripId, totalKrw)}
              >
                일정 기반 자동 배분
              </Button>
              {selectedTrip?.totalBudget ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTotalKrw(selectedTrip.totalBudget!)}
                >
                  일정 예산({selectedTrip.totalBudget.toLocaleString()}원) 적용
                </Button>
              ) : null}
            </div>
            {suggestHint ? <p className="text-xs text-rose-600">{suggestHint}</p> : null}
          </Card>

          <Card>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">배분 · 잔액 (개인 설정)</p>
              <span className="text-xs text-slate-500">
                배분 합계 {allocatedSum.toLocaleString()}원
                {allocatedSum !== totalKrw ? (
                  <span className="text-amber-600"> · 총액과 {Math.abs(totalKrw - allocatedSum).toLocaleString()}원 차이</span>
                ) : null}
              </span>
            </div>
            <p className="text-2xl font-bold text-rose-600">{remaining.toLocaleString()}원 남음</p>
            <p className="text-xs text-slate-500">지출 {spent.toLocaleString()}원 / 총 {totalKrw.toLocaleString()}원</p>
            <div className="mt-3 space-y-3">
              {BUDGET_CATEGORIES.map((cat) => {
                const row = allocations.find((a) => a.category === cat.id);
                const amount = row?.amountKrw ?? 0;
                const pct = totalKrw > 0 ? Math.round((amount / totalKrw) * 100) : 0;

                return (
                  <div key={cat.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{cat.label}</span>
                      <span className="text-xs text-slate-400">{pct}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={amount || ""}
                        onChange={(e) => updateAllocation(cat.id, Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        placeholder="0"
                      />
                      {rate ? (
                        <span className="shrink-0 text-xs text-slate-500">
                          ≈{Math.round(amount * rate.krwToJpy).toLocaleString()}엔
                        </span>
                      ) : null}
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: cat.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="space-y-2">
            <p className="text-sm font-medium">지출 입력</p>
            <select
              value={spentInput.category}
              onChange={(e) => setSpentInput((s) => ({ ...s, category: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              {BUDGET_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="금액 (원)"
              value={spentInput.amountKrw || ""}
              onChange={(e) => setSpentInput((s) => ({ ...s, amountKrw: Number(e.target.value) }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              placeholder="메모"
              value={spentInput.description}
              onChange={(e) => setSpentInput((s) => ({ ...s, description: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            <Button
              type="button"
              onClick={() => {
                if (!spentInput.amountKrw) return;
                setExpenses((e) => [...e, { ...spentInput }]);
                setSpentInput((s) => ({ ...s, amountKrw: 0, description: "" }));
              }}
            >
              지출 추가
            </Button>
            {expenses.length > 0 ? (
              <ul className="mt-2 space-y-1 border-t border-slate-100 pt-2">
                {expenses.map((e, i) => {
                  const label = BUDGET_CATEGORIES.find((c) => c.id === e.category)?.label ?? e.category;
                  return (
                    <li key={`${e.category}-${i}`} className="flex justify-between text-xs text-slate-600">
                      <span>
                        {label}
                        {e.description ? ` · ${e.description}` : ""}
                      </span>
                      <span>{e.amountKrw.toLocaleString()}원</span>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </Card>

          <Button type="button" className="w-full" onClick={saveBudget}>
            이 여행 예산 저장
          </Button>
        </>
      )}
    </div>
  );
}
