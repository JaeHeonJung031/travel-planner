"use client";

import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { KOREA_TO_JAPAN_CHECKLIST } from "@/features/checklist/server/checklist-defaults";

type Item = { id: string; label: string; isChecked: boolean; isDefault: boolean };

export function ChecklistPanel() {
  const [items, setItems] = useState<Item[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/checklist")
      .then((r) => r.json())
      .then((data) => {
        if (data.items?.length) setItems(data.items);
        else {
          setItems(
            KOREA_TO_JAPAN_CHECKLIST.map((label, i) => ({
              id: `default-${i}`,
              label,
              isChecked: false,
              isDefault: true,
            })),
          );
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function persist(next: Item[]) {
    setItems(next);
    await fetch("/api/checklist", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: next }),
    });
  }

  function toggle(id: string) {
    persist(items.map((it) => (it.id === id ? { ...it, isChecked: !it.isChecked } : it)));
  }

  function addItem() {
    if (!newLabel.trim()) return;
    persist([
      ...items,
      { id: crypto.randomUUID(), label: newLabel.trim(), isChecked: false, isDefault: false },
    ]);
    setNewLabel("");
  }

  function removeItem(id: string) {
    persist(items.filter((it) => it.id !== id));
  }

  const done = items.filter((i) => i.isChecked).length;

  if (loading) return <p className="text-sm text-slate-500">불러오는 중...</p>;

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-sm text-slate-600">
          진행률 {done}/{items.length} ({items.length ? Math.round((done / items.length) * 100) : 0}%)
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full bg-rose-500 transition-all"
            style={{ width: `${items.length ? (done / items.length) * 100 : 0}%` }}
          />
        </div>
      </Card>

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <Card className="flex items-center gap-3 !py-3">
              <input type="checkbox" checked={item.isChecked} onChange={() => toggle(item.id)} />
              <span className={`flex-1 text-sm ${item.isChecked ? "line-through text-slate-400" : ""}`}>
                {item.label}
              </span>
              {!item.isDefault ? (
                <button type="button" className="text-xs text-rose-500" onClick={() => removeItem(item.id)}>
                  삭제
                </button>
              ) : null}
            </Card>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="커스텀 항목 추가"
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
        <Button type="button" onClick={addItem}>
          추가
        </Button>
      </div>
    </div>
  );
}
