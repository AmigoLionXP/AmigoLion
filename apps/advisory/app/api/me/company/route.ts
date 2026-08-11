import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { withErrorHandling } from '@/lib/api-guard';
import { withAuth, AuthError } from '@/lib/auth';
import { companies } from '@/db/schema';
import { companyCreateSchema, companyUpdateSchema } from '@/lib/validation';

/** GET /api/me/company — the signed-in Member's own company. RLS guarantees this is the only row reachable. */
export const GET = withErrorHandling(async () =>
  withAuth(['member'], async (tx, profile) => {
    const [company] = await tx.select().from(companies).where(eq(companies.ownerProfileId, profile.id));
    if (!company) throw new AuthError(404, 'Empresa não encontrada para este usuário.');
    return NextResponse.json(company);
  }),
);

/**
 * POST /api/me/company — first-time setup, right after signup: creates the Member's own company
 * on the entry plan (7M0). One company per profile — `companies.owner_profile_id` is unique, so a
 * second call returns 409 instead of silently creating a duplicate tenant for the same account.
 */
export const POST = withErrorHandling(async (req) => {
  const body = companyCreateSchema.parse(await req.json());
  return withAuth(['member'], async (tx, profile) => {
    const [existing] = await tx.select().from(companies).where(eq(companies.ownerProfileId, profile.id));
    if (existing) throw new AuthError(409, 'Este usuário já tem uma empresa cadastrada.');

    const [company] = await tx
      .insert(companies)
      .values({
        ownerProfileId: profile.id,
        legalName: body.legalName,
        tradeName: body.tradeName,
        cnpj: body.cnpj,
        sector: body.sector,
        planCode: '7M0',
      })
      .returning();
    return NextResponse.json(company, { status: 201 });
  });
});

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
