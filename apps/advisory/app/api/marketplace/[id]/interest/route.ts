import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { withErrorHandling } from '@/lib/api-guard';
import { withAuth, AuthError } from '@/lib/auth';
import { companies, marketplaceInterests, marketplaceListings } from '@/db/schema';
import { interestCreateSchema } from '@/lib/validation';

/** POST /api/marketplace/:id/interest — "Tenho interesse" / "Tenho isso — oferecer". */
export const POST = withErrorHandling(async (req, { params }) => {
  const body = interestCreateSchema.parse(await req.json());
  return withAuth(['member'], async (tx, profile) => {
    const [company] = await tx.select().from(companies).where(eq(companies.ownerProfileId, profile.id));
    if (!company) throw new AuthError(404, 'Empresa não encontrada para este usuário.');

    const [listing] = await tx.select().from(marketplaceListings).where(eq(marketplaceListings.id, params.id));
    if (!listing || listing.status !== 'active') throw new AuthError(404, 'Anúncio não encontrado ou não está ativo.');

    const [interest] = await tx
      .insert(marketplaceInterests)
      .values({ listingId: listing.id, companyId: company.id, message: body.message })
      .returning();
    return NextResponse.json(interest, { status: 201 });
  });
});
