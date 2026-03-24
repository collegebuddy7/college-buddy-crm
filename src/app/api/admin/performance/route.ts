import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("cb_token")?.value;
  const agent = token ? verifyToken(token) : null;
  if (!agent?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date") || new Date().toISOString().split("T")[0];

  const selectedDate = new Date(dateStr);
  const dayStart = new Date(selectedDate); dayStart.setHours(0,0,0,0);
  const dayEnd = new Date(selectedDate); dayEnd.setHours(23,59,59,999);

  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);

  const agents = await prisma.agent.findMany({
    select: { id: true, name: true, mobile: true },
    orderBy: { name: "asc" },
  });

  const result = await Promise.all(agents.map(async (a) => {
    const [callsToday, callsOnDate, totalCalls] = await Promise.all([
      prisma.callHistory.count({
        where: { agentId: a.id, calledAt: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.callHistory.count({
        where: { agentId: a.id, calledAt: { gte: dayStart, lte: dayEnd } },
      }),
      prisma.callHistory.count({ where: { agentId: a.id } }),
    ]);
    return { ...a, callsToday, callsOnDate, totalCalls };
  }));

  return NextResponse.json(result);
}
