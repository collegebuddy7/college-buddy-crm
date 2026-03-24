import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.cookies.get("cb_token")?.value;
  const agent = token ? verifyToken(token) : null;
  if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.whatsAppTemplate.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.cookies.get("cb_token")?.value;
  const agent = token ? verifyToken(token) : null;
  if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, message, isDefault } = await req.json();
  const template = await prisma.whatsAppTemplate.update({
    where: { id: params.id },
    data: { name, message, isDefault },
  });
  return NextResponse.json(template);
}
