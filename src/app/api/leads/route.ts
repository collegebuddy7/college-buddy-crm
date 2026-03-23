import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import type { LeadStatus, InterestLevel } from "@prisma/client";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("cb_token")?.value;
  const agent = token ? verifyToken(token) : null;
  if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as LeadStatus | null;
  const interest = searchParams.get("interest") as InterestLevel | null;
  const search = searchParams.get("search") || "";
  const type = searchParams.get("type");

  const where: Record<string, unknown> = {};

  if (type === "new") {
    where.status = "NEW";
    if (!agent.isAdmin) where.assignedAgentId = agent.agentId;
  } else if (type === "followup") {
    where.followUpDate = { lte: new Date() };
    if (!agent.isAdmin) where.assignedAgentId = agent.agentId;
  } else if (type === "mine") {
    where.assignedAgentId = agent.agentId;
  }

  if (status) where.status = status;
  if (interest) where.interest = interest;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { college: { contains: search, mode: "insensitive" } },
      { number: { contains: search } },
    ];
  }

  // Lightweight include - NO call histories or status changes in list view
  const lightInclude = {
    assignedAgent: {
      select: { id: true, name: true },
    },
  };

  if (type === "all") {
    const [assigned, others] = await Promise.all([
      prisma.account.findMany({
        where: { ...where, assignedAgentId: agent.agentId },
        orderBy: { sr: "asc" },
        include: lightInclude,
      }),
      prisma.account.findMany({
        where: { ...where, NOT: { assignedAgentId: agent.agentId } },
        orderBy: { sr: "asc" },
        include: lightInclude,
      }),
    ]);
    return NextResponse.json([...assigned, ...others]);
  }

  const accounts = await prisma.account.findMany({
    where,
    orderBy: { sr: "asc" },
    include: lightInclude,
  });

  return NextResponse.json(accounts);
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("cb_token")?.value;
  const agent = token ? verifyToken(token) : null;
  if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { name, college, number, session, status, interest, followUpDate } = body;

    const lastAccount = await prisma.account.findFirst({ orderBy: { sr: "desc" } });
    const nextSr = (lastAccount?.sr ?? 1000) + 1;

    const account = await prisma.account.create({
      data: {
        sr: nextSr, name, college, number, session,
        status: status || "NEW",
        interest: interest || "MID",
        followUpDate: followUpDate ? new Date(followUpDate) : null,
      },
    });
    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
  }
}