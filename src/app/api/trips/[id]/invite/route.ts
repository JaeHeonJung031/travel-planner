import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/server/db/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email } = await req.json();
  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: "해당 이메일의 회원을 찾을 수 없습니다." }, { status: 404 });

  await prisma.tripCollaborator.upsert({
    where: { tripId_userId: { tripId: id, userId: user.id } },
    create: { tripId: id, userId: user.id, role: "EDITOR" },
    update: {},
  });

  return NextResponse.json({ ok: true });
}
