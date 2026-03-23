import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("cb_token")?.value;
  const agent = token ? verifyToken(token) : null;
  if (!agent?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rows, duplicateActions } = await req.json();

  let imported = 0, skipped = 0, overwritten = 0, errors = 0;

  const lastAccount = await prisma.account.findFirst({ orderBy: { sr: "desc" } });
  let nextSr = (lastAccount?.sr ?? 1000) + 1;

  // Find all duplicate numbers upfront
  const allNumbers = rows.map((r: Record<string, string>) => r.number).filter(Boolean);
  const existingAccounts = await prisma.account.findMany({
    where: { number: { in: allNumbers } },
    select: { number: true, id: true },
  });
  const existingNumbers = new Set(existingAccounts.map((a) => a.number));
  const existingMap = new Map(existingAccounts.map((a) => [a.number, a.id]));

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] as Record<string, string>;
    if (!row.name || !row.number) continue;

    const isDuplicate = existingNumbers.has(row.number?.trim());
    const action = isDuplicate ? (duplicateActions[i] || "skip") : null;

    if (isDuplicate && action === "skip") {
      skipped++;
      continue;
    }

    const data = {
      name: row.name?.trim(),
      college: row.college?.trim() || "",
      number: row.number?.trim(),
      session: row.session?.trim() || "2025-26",
      status: ["NEW","LEAD","INTERESTED","ENROLLED","NOT_INTERESTED"]
        .includes(row.status?.toUpperCase())
        ? (row.status.toUpperCase() as "NEW")
        : "NEW" as const,
      interest: ["HIGH","MID","LOW"].includes(row.interest?.toUpperCase())
        ? (row.interest.toUpperCase() as "HIGH")
        : "MID" as const,
      followUpDate: (row.followupdate || row.followUpDate)
        ? new Date(row.followupdate || row.followUpDate)
        : null,
    };

    try {
      if (isDuplicate && action === "overwrite") {
        const existingId = existingMap.get(row.number?.trim());
        await prisma.account.update({
          where: { id: existingId },
          data,
        });
        overwritten++;
      } else {
        await prisma.account.create({
          data: { ...data, sr: nextSr++ },
        });
        imported++;
      }
    } catch (err: unknown) {
      console.error(`Row ${i} error:`, err);
      errors++;
      // Skip this row and continue with rest
    }
  }

  return NextResponse.json({ imported, skipped, overwritten, errors });
}