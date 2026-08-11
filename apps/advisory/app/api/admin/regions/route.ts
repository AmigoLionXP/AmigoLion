import { NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/api-guard';
import { withAuth } from '@/lib/auth';
import { chapters, companies, regions } from '@/db/schema';

/** GET /api/admin/regions — every praça with its chapter/company counts, for the Admin's regions overview. */
export const GET = withErrorHandling(async () =>
  withAuth(['admin'], async (tx) => {
    const [allRegions, allChapters, allCompanies] = await Promise.all([
      tx.select().from(regions),
      tx.select({ id: chapters.id, regionId: chapters.regionId }).from(chapters),
      tx.select({ id: companies.id, regionId: companies.regionId }).from(companies),
    ]);

    return NextResponse.json(
      allRegions.map((r) => ({
        ...r,
        chapterCount: allChapters.filter((c) => c.regionId === r.id).length,
        companyCount: allCompanies.filter((c) => c.regionId === r.id).length,
      })),
    );
  }),
);
