import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { withErrorHandling } from '@/lib/api-guard';
import { withAuth, AuthError } from '@/lib/auth';
import { companies, marketplaceListings, marketplaceQa } from '@/db/schema';
import { listingUpdateSchema } from '@/lib/validation';

export const GET = withErrorHandling(async (_req, { params }) =>
  withAuth(['member', 'rep', 'admin'], async (tx) => {
    const [listing] = await tx.select().from(marketplaceListings).where(eq(marketplaceListings.id, params.id));
    if (!listing) throw new AuthError(404, 'Anúncio não encontrado.');
    const qa = await tx.select().from(marketplaceQa).where(eq(marketplaceQa.listingId, listing.id));
    return NextResponse.json({ ...listing, qa });
  }),
);

/** Owner (or Admin, for moderation — e.g. flipping status to 'removed') can update. */
export const PATCH = withErrorHandling(async (req, { params }) => {
  const body = listingUpdateSchema.parse(await req.json());
  return withAuth(['member', 'admin'], async (tx, profile) => {
    const [listing] = await tx.select().from(marketplaceListings).where(eq(marketplaceListings.id, params.id));
    if (!listing) throw new AuthError(404, 'Anúncio não encontrado.');
    if (profile.role === 'member') {
      const [company] = await tx.select().from(companies).where(eq(companies.ownerProfileId, profile.id));
      if (!company || company.id !== listing.companyId) throw new AuthError(403, 'Este anúncio não pertence à sua empresa.');
    }

    const { qa, ...fields } = body;
    const [updated] = await tx
      .update(marketplaceListings)
      .set({ ...fields, updatedAt: new Date() })
      .where(eq(marketplaceListings.id, params.id))
      .returning();
    return NextResponse.json(updated);
  });
});

export const DELETE = withErrorHandling(async (_req, { params }) =>
  withAuth(['member', 'admin'], async (tx, profile) => {
    const [listing] = await tx.select().from(marketplaceListings).where(eq(marketplaceListings.id, params.id));
    if (!listing) throw new AuthError(404, 'Anúncio não encontrado.');
    if (profile.role === 'member') {
      const [company] = await tx.select().from(companies).where(eq(companies.ownerProfileId, profile.id));
      if (!company || company.id !== listing.companyId) throw new AuthError(403, 'Este anúncio não pertence à sua empresa.');
    }
    await tx.delete(marketplaceListings).where(eq(marketplaceListings.id, params.id));
    return NextResponse.json({ deleted: true });
  }),
);
