import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.cookies.get("cb_token")?.value;
  const agent = token ? verifyToken(token) : null;
  if (!agent?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.callHistory.deleteMany({ where: { accountId: params.id } });
  await prisma.statusHistory.deleteMany({ where: { accountId: params.id } });
  await prisma.account.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
