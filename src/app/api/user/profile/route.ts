import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/server/db/prisma";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, phone } = await req.json();
  await prisma.user.update({
    where: { id: session.user.id },
    data: { name, phone },
  });

  return NextResponse.json({ ok: true });
}
