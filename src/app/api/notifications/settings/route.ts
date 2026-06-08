import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/server/db/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const setting = await prisma.notificationSetting.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json(
    setting ?? { enabled: true, notifyTime: "08:00", kakaoUserId: "" },
  );
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { enabled, notifyTime, kakaoUserId } = await req.json();

  const setting = await prisma.notificationSetting.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, enabled, notifyTime, kakaoUserId },
    update: { enabled, notifyTime, kakaoUserId },
  });

  return NextResponse.json(setting);
}
