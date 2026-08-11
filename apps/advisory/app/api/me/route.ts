import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { withErrorHandling } from '@/lib/api-guard';
import { withAuth } from '@/lib/auth';
import { companies } from '@/db/schema';

/**
 * GET /api/me — the caller's own profile (role, name, email) plus, for a Member, whether their
 * company has been created yet. The frontend's post-login redirect needs the role before it can
 * decide which dashboard to send the user to, and Members without a company yet need to land on
 * the setup form instead of an empty dashboard.
 */
export const GET = withErrorHandling(async () =>
  withAuth(['member', 'rep', 'admin'], async (tx, profile) => {
    let hasCompany = false;
    if (profile.role === 'member') {
      const [company] = await tx.select({ id: companies.id }).from(companies).where(eq(companies.ownerProfileId, profile.id));
      hasCompany = !!company;
    }
    return NextResponse.json({ ...profile, hasCompany });
  }),
);
