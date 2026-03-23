import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("cb_token")?.value;
  const agent = token ? verifyToken(token) : null;
  if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);

  const callsToday = await prisma.callHistory.count({
    where: { agentId: agent.agentId, calledAt: { gte: todayStart, lte: todayEnd } },
  });

  return NextResponse.json({ callsToday });
}