export const dynamic = "force-dynamic"

import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { contracts, invoices } from "@/lib/db/schema";
import { generateInvoiceNumber, getJakartaMonthYear } from "@/lib/numbering";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const contractId = searchParams.get("contractId");

  if (contractId) {
    const db = getDb();
    const data = await db
      .select()
      .from(invoices)
      .where(eq(invoices.contractId, contractId));
    return NextResponse.json(data);
  }

  const db = getDb();
  const data = await db.select().from(invoices);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();

  if (
    !body?.contractId ||
    !body?.terminId ||
    !body?.invoiceDate ||
    body?.amount === undefined ||
    !body?.status
  ) {
    return NextResponse.json(
      { error: "Data invoice belum lengkap" },
      { status: 400 }
    );
  }

  const now = new Date();
  const db = getDb();
  const invoiceDate = new Date(body.invoiceDate);
  const { year } = getJakartaMonthYear(invoiceDate);
  const [contractRow] = await db
    .select({
      serviceCode: contracts.serviceCode,
      submissionCode: contracts.submissionCode,
    })
    .from(contracts)
    .where(eq(contracts.id, body.contractId))
    .limit(1);

  if (!contractRow) {
    return NextResponse.json({ error: "Kontrak tidak ditemukan" }, { status: 404 });
  }

  const created = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(2027, ${year})`);

    const existingInvoices = await tx
      .select({ invoiceDate: invoices.invoiceDate, seqNo: invoices.seqNo })
      .from(invoices);
    const sameYearInvoices = existingInvoices.filter((invoice) => {
      const invoiceYear = getJakartaMonthYear(new Date(invoice.invoiceDate)).year;
      return invoiceYear === year;
    });
    const maxSeq = sameYearInvoices.reduce(
      (acc, invoice) => Math.max(acc, invoice.seqNo ?? 0),
      0
    );
    const seqNo = maxSeq + 1;
    const invoiceNumber = generateInvoiceNumber({
      seqNo,
      invoiceDate,
      serviceCode: contractRow.serviceCode as "A" | "B" | "C",
      submissionCode: contractRow.submissionCode,
    });

    const [row] = await tx
      .insert(invoices)
      .values({
        id: crypto.randomUUID(),
        invoiceDate,
        contractId: body.contractId,
        terminId: body.terminId,
        seqNo,
        invoiceNumber,
        amount: body.amount.toString(),
        status: body.status,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return row;
  });

  return NextResponse.json(created, { status: 201 });
}
