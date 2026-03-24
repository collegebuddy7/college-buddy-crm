export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("cb_token")?.value;
  const agent = token ? verifyToken(token) : null;
  if (!agent?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { type, agentId, college, srFrom, srTo, leadId } = await req.json();
    let where: Record<string, unknown> = {};

    if (type === "college" && college) {
      const collegeLeads = await prisma.account.findMany({
        where: { college: college },
        select: { id: true },
      });
      const ids = collegeLeads.map((l) => l.id);
      if (ids.length === 0) return NextResponse.json({ assigned: 0 });
      where = { id: { in: ids } };

    } else if (type === "range" && srFrom !== undefined && srTo !== undefined) {
      where = { sr: { gte: Number(srFrom), lte: Number(srTo) } };

    } else if (type === "individual" && leadId) {
      where = { id: leadId };

    } else {
      return NextResponse.json({ error: "Invalid assignment params" }, { status: 400 });
    }

    const result = await prisma.account.updateMany({
      where,
      data: { assignedAgentId: agentId || null },
    });

    return NextResponse.json({ assigned: result.count });

  } catch (error) {
    console.error("Assign error:", error);
    return NextResponse.json({ error: "Assignment failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get("cb_token")?.value;
  const agent = token ? verifyToken(token) : null;
  if (!agent?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const agents = await prisma.agent.findMany({
      select: {
        id: true, name: true, mobile: true, isAdmin: true,
        _count: { select: { assignedLeads: true } },
      },
      orderBy: { name: "asc" },
    });

    const allAccounts = await prisma.account.findMany({
      select: { college: true },
    });

    const collegeMap: Record<string, number> = {};
    allAccounts.forEach((a) => {
      collegeMap[a.college] = (collegeMap[a.college] || 0) + 1;
    });

    const colleges = Object.entries(collegeMap)
      .map(([college, count]) => ({ college, _count: { college: count } }))
      .sort((a, b) => a.college.localeCompare(b.college));

    return NextResponse.json({ agents, colleges });

  } catch (error) {
    console.error("GET assign error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
