import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { auth } from "@/auth";
import { prisma } from "@/server/db/prisma";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const token = randomBytes(16).toString("hex");

  const trip = await prisma.trip.updateMany({
    where: { id, userId: session.user.id },
    data: { shareToken: token },
  });

  if (!trip.count) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ shareToken: token });
}
