import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { withErrorHandling } from '@/lib/api-guard';
import { withAuth, AuthError } from '@/lib/auth';
import { companies } from '@/db/schema';
import { companyUpdateSchema } from '@/lib/validation';

/** GET /api/me/company — the signed-in Member's own company. RLS guarantees this is the only row reachable. */
export const GET = withErrorHandling(async () =>
  withAuth(['member'], async (tx, profile) => {
    const [company] = await tx.select().from(companies).where(eq(companies.ownerProfileId, profile.id));
    if (!company) throw new AuthError(404, 'Empresa não encontrada para este usuário.');
    return NextResponse.json(company);
  }),
);

export const PATCH = withErrorHandling(async (req) => {
  const body = companyUpdateSchema.parse(await req.json());
  return withAuth(['member'], async (tx, profile) => {
    const [updated] = await tx
      .update(companies)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(companies.ownerProfileId, profile.id))
      .returning();
    if (!updated) throw new AuthError(404, 'Empresa não encontrada para este usuário.');
    return NextResponse.json(updated);
  });
});
