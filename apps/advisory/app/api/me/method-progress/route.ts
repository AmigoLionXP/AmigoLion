import { NextResponse } from 'next/server';
import { eq, asc } from 'drizzle-orm';
import { withErrorHandling } from '@/lib/api-guard';
import { withAuth, AuthError } from '@/lib/auth';
import { companies, methodProgress, methodSteps } from '@/db/schema';
import type { Tx } from '@/db/rls-context';

/** Idempotent: creates the 7 progress rows (step 1 = next, rest locked) the first time a company is read. */
async function getOrInitProgress(tx: Tx, companyId: string) {
  const existing = await tx.select().from(methodProgress).where(eq(methodProgress.companyId, companyId));
  if (existing.length > 0) return existing;

  const rows = await tx
    .insert(methodProgress)
    .values(
      Array.from({ length: 7 }, (_, i) => ({
        companyId,
        stepN: i + 1,
        status: i === 0 ? ('next' as const) : ('locked' as const),
        pct: 0,
      })),
    )
    .returning();
  return rows;
}

/** GET /api/me/method-progress — the 7 steps with the caller's own company's progress joined in. */
export const GET = withErrorHandling(async () =>
  withAuth(['member'], async (tx, profile) => {
    const [company] = await tx.select().from(companies).where(eq(companies.ownerProfileId, profile.id));
    if (!company) throw new AuthError(404, 'Empresa não encontrada para este usuário.');

    const [steps, progress] = await Promise.all([
      tx.select().from(methodSteps).orderBy(asc(methodSteps.n)),
      getOrInitProgress(tx, company.id),
    ]);

    const progressByStep = new Map(progress.map((p) => [p.stepN, p]));
    return NextResponse.json(
      steps.map((step) => ({ ...step, progress: progressByStep.get(step.n) ?? null })),
    );
  }),
);
