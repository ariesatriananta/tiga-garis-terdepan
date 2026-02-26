export const dynamic = "force-dynamic"

import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { clients, contracts } from "@/lib/db/schema";
import { generateProposalNumber, getJakartaMonthYear } from "@/lib/numbering";

export async function GET() {
  const db = getDb();
  const rows = await db
    .select({ contract: contracts, client: clients })
    .from(contracts)
    .leftJoin(clients, eq(contracts.clientId, clients.id));

  const data = rows.map(({ contract, client }) => ({
    ...contract,
    client: client ?? undefined,
  }));

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();

  if (
    !body?.clientId ||
    !body?.proposalDate ||
    !body?.serviceCode ||
    !body?.submissionCode ||
    body?.contractValue === undefined ||
    !body?.paymentStatus ||
    !body?.status
  ) {
    return NextResponse.json(
      { error: "Data contract belum lengkap" },
      { status: 400 }
    );
  }

  const now = new Date();
  const db = getDb();
  const proposalDate = new Date(body.proposalDate);
  const { year } = getJakartaMonthYear(proposalDate);

  const created = await db.transaction(async (tx) => {
    // Serialize contract numbering per year to avoid duplicate seq under concurrent creates.
    await tx.execute(sql`select pg_advisory_xact_lock(2026, ${year})`);

    const [{ maxEngagement }] = await tx
      .select({ maxEngagement: sql<number>`coalesce(max(${contracts.engagementNo}), 0)` })
      .from(contracts)
      .where(and(eq(contracts.clientId, body.clientId), eq(contracts.serviceCode, body.serviceCode)));
    const engagementNo = Number(maxEngagement ?? 0) + 1;

    const existingContracts = await tx
      .select({ proposalDate: contracts.proposalDate, seqNo: contracts.seqNo })
      .from(contracts);
    const maxSeqInYear = existingContracts
      .filter((contract) => getJakartaMonthYear(new Date(contract.proposalDate)).year === year)
      .reduce((max, contract) => Math.max(max, contract.seqNo ?? 0), 0);
    const seqNo = maxSeqInYear + 1;

    const proposalNumber = generateProposalNumber({
      seqNo,
      serviceCode: body.serviceCode,
      submissionCode: body.submissionCode,
      proposalDate,
    });

    const [row] = await tx
      .insert(contracts)
      .values({
        id: crypto.randomUUID(),
        proposalDate,
        clientId: body.clientId,
        serviceCode: body.serviceCode,
        submissionCode: body.submissionCode,
        engagementNo,
        seqNo,
        proposalNumber,
        contractTitle: body.contractTitle ?? null,
        contractValue: body.contractValue.toString(),
        paymentStatus: body.paymentStatus,
        status: body.status,
        notes: body.notes ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return row;
  });

  return NextResponse.json(created, { status: 201 });
}
