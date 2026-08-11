import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { withErrorHandling } from '@/lib/api-guard';
import { withAuth } from '@/lib/auth';
import { companies, verifications } from '@/db/schema';

/**
 * GET /api/admin/verifications — pending "7M Verified" requests with the requesting company's
 * name, so the moderation screen has something to show without needing the verification id
 * up front (only PATCH /api/admin/verifications/:id existed until now).
 */
export const GET = withErrorHandling(async () =>
  withAuth(['admin'], async (tx) => {
    const rows = await tx
      .select({
        id: verifications.id,
        status: verifications.status,
        documentPath: verifications.documentPath,
        createdAt: verifications.createdAt,
        companyId: companies.id,
        companyName: companies.legalName,
        companySector: companies.sector,
      })
      .from(verifications)
      .innerJoin(companies, eq(verifications.companyId, companies.id))
      .where(eq(verifications.status, 'pending'));
    return NextResponse.json(rows);
  }),
);
