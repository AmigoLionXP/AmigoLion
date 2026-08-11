import { NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/api-guard';
import { withAuth } from '@/lib/auth';
import { companies } from '@/db/schema';

/** GET /api/admin/companies — every company, any praça. Admin-only by role AND by RLS. */
export const GET = withErrorHandling(async () =>
  withAuth(['admin'], async (tx) => {
    const rows = await tx.select().from(companies);
    return NextResponse.json(rows);
  }),
);
