import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, hashPassword } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.cookies.get("cb_token")?.value;
  const agent = token ? verifyToken(token) : null;
  if (!agent?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { name, isAdmin, password } = await req.json();
  const data: Record<string, unknown> = { name, isAdmin };
  if (password) data.password = await hashPassword(password);
  const updated = await prisma.agent.update({ where: { id: params.id }, data, select: { id: true, name: true, mobile: true, isAdmin: true } });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.cookies.get("cb_token")?.value;
  const agent = token ? verifyToken(token) : null;
  if (!agent?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (params.id === agent.agentId) return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  await prisma.agent.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
