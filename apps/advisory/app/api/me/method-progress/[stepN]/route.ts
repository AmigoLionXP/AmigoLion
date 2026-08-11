import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { withErrorHandling } from '@/lib/api-guard';
import { withAuth, AuthError } from '@/lib/auth';
import { companies, methodProgress } from '@/db/schema';
import { methodProgressUpdateSchema } from '@/lib/validation';

/**
 * PATCH /api/me/method-progress/:stepN — updates the caller's own progress on one step. Marking
 * a step `done` auto-unlocks the next one (locked -> next), mirroring the 7MARKET Growth Office
 * MethodEngineService's rule: a rung only opens once the previous one is actually finished.
 */
export const PATCH = withErrorHandling(async (req, { params }) => {
  const stepN = Number(params.stepN);
  if (!Number.isInteger(stepN) || stepN < 1 || stepN > 7) {
    return NextResponse.json({ error: 'Passo inválido — use 1 a 7.' }, { status: 400 });
  }
  const body = methodProgressUpdateSchema.parse(await req.json());

  return withAuth(['member'], async (tx, profile) => {
    const [company] = await tx.select().from(companies).where(eq(companies.ownerProfileId, profile.id));
    if (!company) throw new AuthError(404, 'Empresa não encontrada para este usuário.');

    const [current] = await tx
      .select()
      .from(methodProgress)
      .where(and(eq(methodProgress.companyId, company.id), eq(methodProgress.stepN, stepN)));
    if (!current) throw new AuthError(404, 'Progresso deste passo ainda não foi inicializado — chame GET /api/me/method-progress primeiro.');
    if (current.status === 'locked') throw new AuthError(403, 'Este passo ainda está bloqueado.');

    const wasDone = current.status === 'done';
    const nextStatus = body.status ?? current.status;
    const nextPct = body.pct ?? current.pct;

    const [updated] = await tx
      .update(methodProgress)
      .set({
        status: nextStatus,
        pct: nextPct,
        startedAt: current.startedAt ?? new Date(),
        completedAt: nextStatus === 'done' ? (current.completedAt ?? new Date()) : current.completedAt,
        updatedAt: new Date(),
      })
      .where(eq(methodProgress.id, current.id))
      .returning();

    let unlockedStepN: number | null = null;
    if (!wasDone && nextStatus === 'done' && stepN < 7) {
      const [next] = await tx
        .select()
        .from(methodProgress)
        .where(and(eq(methodProgress.companyId, company.id), eq(methodProgress.stepN, stepN + 1)));
      if (next && next.status === 'locked') {
        await tx.update(methodProgress).set({ status: 'next', updatedAt: new Date() }).where(eq(methodProgress.id, next.id));
        unlockedStepN = stepN + 1;
      }
    }

    return NextResponse.json({ step: updated, unlockedStepN });
  });
});
