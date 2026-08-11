import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { withErrorHandling } from '@/lib/api-guard';
import { withAuth, AuthError } from '@/lib/auth';
import { companies, profiles, verifications } from '@/db/schema';
import { verificationReviewSchema } from '@/lib/validation';
import { emailTemplates, getEmailProvider } from '@/lib/providers/email';
import { getWhatsAppProvider } from '@/lib/providers/whatsapp';

/**
 * PATCH /api/admin/verifications/:id — approve/reject a "7M Verified" document request.
 * Approving also flips the company's own `verified` flag — it's the pre-requisite for a Seat,
 * the marketplace badge, and 7M Capital per the architecture doc.
 */
export const PATCH = withErrorHandling(async (req, { params }) => {
  const body = verificationReviewSchema.parse(await req.json());
  return withAuth(['admin'], async (tx, profile) => {
    const [verification] = await tx.select().from(verifications).where(eq(verifications.id, params.id));
    if (!verification) throw new AuthError(404, 'Solicitação de verificação não encontrada.');

    const [updated] = await tx
      .update(verifications)
      .set({ status: body.status, reviewedByProfileId: profile.id, reviewedAt: new Date() })
      .where(eq(verifications.id, params.id))
      .returning();

    if (body.status === 'approved') {
      const [company] = await tx
        .update(companies)
        .set({ verified: true, verifiedAt: new Date(), updatedAt: new Date() })
        .where(eq(companies.id, verification.companyId))
        .returning();

      const [owner] = await tx.select().from(profiles).where(eq(profiles.id, company.ownerProfileId));
      if (owner) {
        const template = emailTemplates.verificationApproved(company.legalName);
        getEmailProvider()
          .send({ to: owner.email, ...template })
          .catch((err) => console.error('verification approval email failed:', err));
        if (owner.phone) {
          getWhatsAppProvider()
            .sendMessage(owner.phone, `Sua empresa ${company.legalName} agora tem o selo 7M Verified! 🎉`)
            .catch((err) => console.error('verification approval whatsapp failed:', err));
        }
      }
    }

    return NextResponse.json(updated);
  });
});
