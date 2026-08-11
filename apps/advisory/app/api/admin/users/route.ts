import { NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/api-guard';
import { withAuth } from '@/lib/auth';
import { profiles } from '@/db/schema';

/** GET /api/admin/users — every profile (any role), for the Advisory Admin "Usuários & permissões" panel. */
export const GET = withErrorHandling(async () =>
  withAuth(['admin'], async (tx) => {
    const rows = await tx
      .select({ id: profiles.id, fullName: profiles.fullName, email: profiles.email, role: profiles.role, createdAt: profiles.createdAt })
      .from(profiles);
    return NextResponse.json(rows);
  }),
);
