import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { withErrorHandling } from '@/lib/api-guard';
import { withAuth, AuthError } from '@/lib/auth';
import { companies, marketplaceListings, marketplaceQa } from '@/db/schema';
import { listingCreateSchema } from '@/lib/validation';

/**
 * GET /api/marketplace — network-wide browse. RLS (`listings_select`) already restricts rows to
 * `status = 'active'` plus the caller's own listings of any status; any signed-in role can call
 * this (Member browsing to buy, Rep/Admin moderating).
 */
export const GET = withErrorHandling(async () =>
  withAuth(['member', 'rep', 'admin'], async (tx) => {
    const listings = await tx.select().from(marketplaceListings);
    return NextResponse.json(listings);
  }),
);

/** POST /api/marketplace — publish a new listing/intent under the caller's own company. */
export const POST = withErrorHandling(async (req) => {
  const body = listingCreateSchema.parse(await req.json());
  return withAuth(['member'], async (tx, profile) => {
    const [company] = await tx.select().from(companies).where(eq(companies.ownerProfileId, profile.id));
    if (!company) throw new AuthError(404, 'Empresa não encontrada para este usuário.');

    const [listing] = await tx
      .insert(marketplaceListings)
      .values({
        companyId: company.id,
        type: body.type,
        category: body.category,
        title: body.title,
        description: body.description,
        priceLabel: body.priceLabel,
        location: body.location,
        status: 'pending_review',
      })
      .returning();

    if (body.qa?.length) {
      await tx.insert(marketplaceQa).values(
        body.qa.map((qa, i) => ({ listingId: listing.id, question: qa.question, answer: qa.answer, sortOrder: i })),
      );
    }

    return NextResponse.json(listing, { status: 201 });
  });
});
