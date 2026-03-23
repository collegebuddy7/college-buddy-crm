import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("cb_token")?.value;
  const agent = token ? verifyToken(token) : null;
  if (!agent?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { numbers } = await req.json();
  const existing = await prisma.account.findMany({
    where: { number: { in: numbers } },
    select: { id: true, number: true, name: true, status: true, college: true },
  });
  const duplicates = existing.map((e) => ({ number: e.number, existing: e }));
  return NextResponse.json({ duplicates });
}
