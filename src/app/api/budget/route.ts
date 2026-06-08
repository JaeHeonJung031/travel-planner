import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/server/db/prisma";

function tripBudgetWhere(userId: string, tripId: string | null | undefined) {
  return tripId
    ? { userId, tripId }
    : { userId, tripId: null };
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tripId = new URL(req.url).searchParams.get("tripId");

  const budget = tripId
    ? await prisma.budget.findFirst({
        where: tripBudgetWhere(session.user.id, tripId),
        include: { allocations: true },
        orderBy: { updatedAt: "desc" },
      })
    : await prisma.budget.findFirst({
        where: { userId: session.user.id },
        include: { allocations: true },
        orderBy: { updatedAt: "desc" },
      });

  const expenseWhere = tripId
    ? { userId: session.user.id, tripId }
    : { userId: session.user.id };

  const expenses = await prisma.expenseEntry.findMany({
    where: expenseWhere,
    orderBy: { spentAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    tripId: budget?.tripId ?? tripId ?? null,
    totalKrw: budget?.totalKrw ?? 0,
    allocations: budget?.allocations.map((a) => ({
      category: a.category,
      amountKrw: a.amountKrw,
    })) ?? [],
    expenses: expenses.map((e) => ({
      category: e.category,
      amountKrw: e.amountKrw,
      description: e.description,
    })),
  });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { totalKrw, allocations, expenses, tripId } = await req.json();

  if (!tripId) {
    return NextResponse.json({ error: "tripId가 필요합니다." }, { status: 400 });
  }

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId: session.user.id },
  });
  if (!trip) {
    return NextResponse.json({ error: "여행을 찾을 수 없습니다." }, { status: 404 });
  }

  let budget = await prisma.budget.findFirst({
    where: tripBudgetWhere(session.user.id, tripId),
  });

  if (!budget) {
    budget = await prisma.budget.create({
      data: { userId: session.user.id, tripId, totalKrw },
    });
  } else {
    budget = await prisma.budget.update({
      where: { id: budget.id },
      data: { totalKrw, tripId },
    });
  }

  await prisma.trip.update({
    where: { id: tripId },
    data: { totalBudget: totalKrw },
  });

  await prisma.budgetAllocation.deleteMany({ where: { budgetId: budget.id } });
  if (allocations?.length) {
    await prisma.budgetAllocation.createMany({
      data: allocations.map((a: { category: string; amountKrw: number }) => ({
        budgetId: budget!.id,
        category: a.category,
        amountKrw: a.amountKrw,
      })),
    });
  }

  await prisma.expenseEntry.deleteMany({
    where: { userId: session.user.id, tripId },
  });

  if (expenses?.length) {
    await prisma.expenseEntry.createMany({
      data: expenses.map((e: { category: string; amountKrw: number; description?: string }) => ({
        userId: session.user!.id,
        tripId,
        category: e.category,
        amountKrw: e.amountKrw,
        description: e.description,
      })),
    });
  }

  return NextResponse.json({ ok: true, tripId });
}
