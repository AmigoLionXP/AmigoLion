import { NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';
import { withErrorHandling } from '@/lib/api-guard';
import { withAuth } from '@/lib/auth';
import { commissions, transactions } from '@/db/schema';

/** GET /api/admin/transactions — the full intermediated-deals ledger, with each commission row. */
export const GET = withErrorHandling(async () =>
  withAuth(['admin'], async (tx) => {
    const [txRows, commissionRows] = await Promise.all([
      tx.select().from(transactions).orderBy(desc(transactions.createdAt)),
      tx.select().from(commissions),
    ]);
    const commissionsByTx = new Map<string, typeof commissionRows>();
    for (const c of commissionRows) {
      if (!commissionsByTx.has(c.transactionId)) commissionsByTx.set(c.transactionId, []);
      commissionsByTx.get(c.transactionId)!.push(c);
    }
    return NextResponse.json(txRows.map((t) => ({ ...t, commissions: commissionsByTx.get(t.id) ?? [] })));
  }),
);
