import { NextResponse } from 'next/server';
import { and, avg, count, gte, inArray, sql } from 'drizzle-orm';
import { withErrorHandling } from '@/lib/api-guard';
import { withAuth } from '@/lib/auth';
import { commissions, companies, plans, profiles, subscriptions, transactions } from '@/db/schema';

/** GET /api/admin/metrics — the Advisory Admin KPI row: users, MRR, transactions/month, avg commission. */
export const GET = withErrorHandling(async () =>
  withAuth(['admin'], async (tx) => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [[{ activeUsers }], [{ activeCompanies }], mrrRows, [{ txThisMonth }], [{ avgCommissionPct }]] = await Promise.all([
      tx.select({ activeUsers: count() }).from(profiles),
      tx.select({ activeCompanies: count() }).from(companies),
      tx
        .select({ priceCents: plans.priceCents })
        .from(subscriptions)
        .innerJoin(plans, sql`${subscriptions.planCode} = ${plans.code}`)
        .where(inArray(subscriptions.status, ['active', 'trialing'])),
      tx.select({ txThisMonth: count() }).from(transactions).where(and(gte(transactions.createdAt, startOfMonth))),
      tx.select({ avgCommissionPct: avg(commissions.ratePct) }).from(commissions),
    ]);

    const mrrCents = mrrRows.reduce((total, r) => total + r.priceCents, 0);

    return NextResponse.json({
      activeUsers,
      activeCompanies,
      mrrCents,
      transactionsThisMonth: txThisMonth,
      avgCommissionPct: avgCommissionPct ? Number(avgCommissionPct) : 0,
    });
  }),
);
