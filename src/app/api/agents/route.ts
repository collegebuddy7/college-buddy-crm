import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, hashPassword } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("cb_token")?.value;
  const agent = token ? verifyToken(token) : null;
  if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agents = await prisma.agent.findMany({
    select: { id: true, name: true, mobile: true, createdAt: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(agents);
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("cb_token")?.value;
  const agent = token ? verifyToken(token) : null;
  if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name, mobile, password } = await req.json();
    if (!name || !mobile || !password) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }

    const hashed = await hashPassword(password);
    const newAgent = await prisma.agent.create({
      data: { name, mobile, password: hashed },
      select: { id: true, name: true, mobile: true },
    });

    return NextResponse.json(newAgent, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed";
    if (msg.includes("duplicate") || msg.includes("unique")) {
      return NextResponse.json({ error: "Mobile number already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create agent" }, { status: 500 });
  }
}