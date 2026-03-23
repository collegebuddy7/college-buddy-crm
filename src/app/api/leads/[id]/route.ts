import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { LeadStatus, InterestLevel, CallDirection } from "@prisma/client";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.cookies.get("cb_token")?.value;
  const agent = token ? verifyToken(token) : null;
  if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const account = await prisma.account.findUnique({
    where: { id: params.id },
    include: {
      callHistories: {
        include: { agent: { select: { name: true } } },
        orderBy: { calledAt: "desc" },
      },
      statusChanges: {
        include: { agent: { select: { name: true } } },
        orderBy: { changedAt: "desc" },
      },
    },
  });

  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(account);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.cookies.get("cb_token")?.value;
  const agent = token ? verifyToken(token) : null;
  if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { status, interest, followUpDate, callNote, callDirection } = body;

    const current = await prisma.account.findUnique({ where: { id: params.id } });
    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.account.update({
      where: { id: params.id },
      data: {
        ...(status && { status: status as LeadStatus }),
        ...(interest && { interest: interest as InterestLevel }),
        ...(followUpDate !== undefined && {
          followUpDate: followUpDate ? new Date(followUpDate) : null,
        }),
      },
    });

    if (status && status !== current.status) {
      await prisma.statusHistory.create({
        data: {
          accountId: params.id,
          agentId: agent.agentId,
          oldStatus: current.status,
          newStatus: status as LeadStatus,
        },
      });
    }

    if (callNote !== undefined || callDirection) {
      await prisma.callHistory.create({
        data: {
          accountId: params.id,
          agentId: agent.agentId,
          direction: (callDirection || "OUTGOING") as CallDirection,
          notes: callNote || null,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update lead error:", error);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}