import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/server/db/prisma";
import { KOREA_TO_JAPAN_CHECKLIST } from "@/features/checklist/server/checklist-defaults";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const checklist = await prisma.checklist.findFirst({
    where: { userId: session.user.id },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  if (!checklist) return NextResponse.json({ items: [] });

  return NextResponse.json({
    items: checklist.items.map((it) => ({
      id: it.id,
      label: it.label,
      isChecked: it.isChecked,
      isDefault: it.isDefault,
    })),
  });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { items } = (await req.json()) as {
    items: { id: string; label: string; isChecked: boolean; isDefault: boolean }[];
  };

  let checklist = await prisma.checklist.findFirst({
    where: { userId: session.user.id },
  });

  if (!checklist) {
    checklist = await prisma.checklist.create({
      data: { userId: session.user.id },
    });
  }

  await prisma.checklistItem.deleteMany({ where: { checklistId: checklist.id } });
  await prisma.checklistItem.createMany({
    data: items.map((item, index) => ({
      checklistId: checklist!.id,
      label: item.label,
      isChecked: item.isChecked,
      isDefault: item.isDefault,
      sortOrder: index,
    })),
  });

  return NextResponse.json({ ok: true });
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const exists = await prisma.checklist.findFirst({ where: { userId: session.user.id } });
  if (exists) return NextResponse.json({ ok: true });

  const checklist = await prisma.checklist.create({
    data: {
      userId: session.user.id,
      items: {
        create: KOREA_TO_JAPAN_CHECKLIST.map((label, i) => ({
          label,
          isDefault: true,
          sortOrder: i,
        })),
      },
    },
  });

  return NextResponse.json({ id: checklist.id });
}
