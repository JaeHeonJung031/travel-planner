import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..", "src");

const replacements = [
  [/@\/components\/ui\//g, "@/shared/ui/"],
  [/@\/components\/layout\//g, "@/shared/layout/"],
  [/"@\/components\/providers"/g, '"@/shared/providers"'],
  [/@\/components\/auth\//g, "@/features/auth/components/"],
  [/@\/components\/chat\//g, "@/features/chat/components/"],
  [/@\/components\/trips\//g, "@/features/trips/components/"],
  [/@\/components\/stays\//g, "@/features/stays/components/"],
  [/@\/components\/attractions\//g, "@/features/attractions/components/"],
  [/@\/components\/restaurants\//g, "@/features/restaurants/components/"],
  [/@\/components\/budget\//g, "@/features/budget/components/"],
  [/@\/components\/checklist\//g, "@/features/checklist/components/"],
  [/@\/components\/planner\//g, "@/features/planner/components/"],
  [/@\/components\/home\//g, "@/features/home/components/"],
  [/@\/components\/profile\//g, "@/features/profile/components/"],
  [/@\/components\/settings\//g, "@/features/notifications/components/"],
  [/@\/lib\/prisma/g, "@/server/db/prisma"],
  [/@\/lib\/ai\//g, "@/server/ai/"],
  [/@\/lib\/kakao\//g, "@/features/notifications/server/kakao/"],
  [/@\/lib\/notifications\//g, "@/features/notifications/server/"],
  [/@\/lib\/time\/kst/g, "@/features/notifications/server/time/kst"],
  [/@\/lib\/attractions\//g, "@/features/attractions/server/"],
  [/@\/lib\/constants/g, "@/shared/lib/constants"],
  [/@\/lib\/trip-dates/g, "@/shared/lib/trip-dates"],
  [/@\/lib\/view-mode-server/g, "@/shared/lib/view-mode-server"],
  [/@\/lib\/view-mode/g, "@/shared/lib/view-mode"],
  [/@\/lib\/resolve-view-mode/g, "@/shared/lib/resolve-view-mode"],
  [/@\/lib\/device/g, "@/shared/lib/device"],
  [/@\/lib\/shortcut-groups/g, "@/shared/lib/shortcut-groups"],
  [/@\/lib\/checklist-defaults/g, "@/features/checklist/server/checklist-defaults"],
  [/@\/lib\/exchange-rate/g, "@/features/budget/server/exchange-rate"],
  [/@\/lib\/home-data/g, "@/features/home/lib/home-data"],
  [/@\/lib\/social-providers/g, "@/features/auth/server/social-providers"],
  [/@\/hooks\//g, "@/shared/hooks/"],
];

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === "lib" && dir.endsWith("src")) continue;
      walk(p, files);
    } else if (/\.(tsx?|mts)$/.test(name)) files.push(p);
  }
  return files;
}

let count = 0;
for (const file of walk(root)) {
  let text = readFileSync(file, "utf8");
  const orig = text;
  for (const [from, to] of replacements) text = text.replace(from, to);
  if (text !== orig) {
    writeFileSync(file, text);
    count++;
  }
}
console.log("Updated", count, "files");
