/**
 * 후쿠오카 더미 일정을 로그인 사용자(또는 첫 번째 사용자) DB에 추가
 * 사용: npm run seed:fukuoka
 * 특정 이메일: SEED_USER_EMAIL=you@example.com npm run seed:fukuoka
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { addDays, startOfDay } from "date-fns";

const prisma = new PrismaClient();

const dataPath = resolve(import.meta.dirname, "../data/dummy/fukuoka-trip.json");
const template = JSON.parse(readFileSync(dataPath, "utf8"));

async function main() {
  const email = process.env.SEED_USER_EMAIL?.trim();
  const user = email
    ? await prisma.user.findUnique({ where: { email } })
    : await prisma.user.findFirst({ orderBy: { createdAt: "desc" } });

  if (!user) {
    console.error("\n[오류] 사용자가 없습니다. 먼저 회원가입 또는 구글/카카오 로그인하세요.\n");
    process.exit(1);
  }

  const today = startOfDay(new Date());
  const endDate = addDays(today, template.days.length - 1);

  const existing = await prisma.trip.findFirst({
    where: { userId: user.id, title: template.title },
  });
  if (existing) {
    console.log(`\n[안내] 이미 같은 일정이 있습니다: /trips/${existing.id}\n`);
    process.exit(0);
  }

  const trip = await prisma.trip.create({
    data: {
      userId: user.id,
      title: template.title,
      region: template.region,
      startDate: today,
      endDate: endDate,
      totalBudget: template.totalBudgetKrw,
      days: {
        create: template.days.map((day) => ({
          dayIndex: day.dayIndex,
          date: addDays(today, day.dayIndex),
          items: {
            create: day.items.map((item, i) => ({
              sortOrder: i,
              placeName: item.placeName,
              startTime: item.startTime ?? null,
              endTime: item.endTime ?? null,
              transport: item.transport ?? null,
              notes: item.notes ?? null,
            })),
          },
        })),
      },
    },
    include: { days: { include: { items: true } } },
  });

  console.log("\n[완료] 후쿠오카 더미 일정이 추가되었습니다.");
  console.log(`       사용자: ${user.email ?? user.name ?? user.id}`);
  console.log(`       제목: ${trip.title}`);
  console.log(`       기간: ${today.toISOString().slice(0, 10)} ~ ${endDate.toISOString().slice(0, 10)}`);
  console.log(`       보기: http://localhost:3000/trips/${trip.id}`);
  console.log(`       (오늘 일정 ${trip.days.find((d) => d.dayIndex === 0)?.items.length ?? 0}개 — 카카오 알림 테스트 가능)\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
