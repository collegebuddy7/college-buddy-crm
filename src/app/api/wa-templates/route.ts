import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("cb_token")?.value;
  const agent = token ? verifyToken(token) : null;
  if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const templates = await prisma.whatsAppTemplate.findMany({
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("cb_token")?.value;
  const agent = token ? verifyToken(token) : null;
  if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, message, isDefault } = await req.json();
  if (!name || !message) return NextResponse.json({ error: "Name and message required" }, { status: 400 });

  const template = await prisma.whatsAppTemplate.create({
    data: { name, message, createdBy: agent.agentId, isDefault: isDefault || false },
  });
  return NextResponse.json(template, { status: 201 });
}