import { NextResponse } from 'next/server';
import { eq, or } from 'drizzle-orm';
import { withErrorHandling } from '@/lib/api-guard';
import { withAuth, AuthError } from '@/lib/auth';
import { companies, give7Referrals } from '@/db/schema';
import { give7CreateSchema } from '@/lib/validation';

/** GET /api/me/give7 — referrals the caller's company gave or received. */
export const GET = withErrorHandling(async () =>
  withAuth(['member'], async (tx, profile) => {
    const [company] = await tx.select().from(companies).where(eq(companies.ownerProfileId, profile.id));
    if (!company) throw new AuthError(404, 'Empresa não encontrada para este usuário.');

    const referrals = await tx
      .select()
      .from(give7Referrals)
      .where(or(eq(give7Referrals.originCompanyId, company.id), eq(give7Referrals.destinationCompanyId, company.id)));

    return NextResponse.json({
      given: referrals.filter((r) => r.originCompanyId === company.id),
      received: referrals.filter((r) => r.destinationCompanyId === company.id),
    });
  }),
);

/** POST /api/me/give7 — log one of the 7 indication types given to another member. */
export const POST = withErrorHandling(async (req) => {
  const body = give7CreateSchema.parse(await req.json());
  return withAuth(['member'], async (tx, profile) => {
    const [company] = await tx.select().from(companies).where(eq(companies.ownerProfileId, profile.id));
    if (!company) throw new AuthError(404, 'Empresa não encontrada para este usuário.');

    const [referral] = await tx
      .insert(give7Referrals)
      .values({
        originCompanyId: company.id,
        destinationCompanyId: body.destinationCompanyId,
        typeN: body.typeN,
        description: body.description,
        estimatedValue: body.estimatedValue?.toString(),
      })
      .returning();
    return NextResponse.json(referral, { status: 201 });
  });
});
