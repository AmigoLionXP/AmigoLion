import { NextResponse } from 'next/server';
import { eq, inArray } from 'drizzle-orm';
import { withErrorHandling } from '@/lib/api-guard';
import { withAuth, AuthError } from '@/lib/auth';
import { chapters, commissions, companies, regions, seats } from '@/db/schema';

/**
 * GET /api/rep/region — the City Leader's own praça: chapters, Seat occupancy, member companies,
 * and the commissions they've personally earned. RLS scopes every one of these queries to the
 * region `regions.city_leader_profile_id = auth.uid()` resolves to — a Rep physically cannot
 * pull another region's rows even if this handler had a bug.
 */
export const GET = withErrorHandling(async () =>
  withAuth(['rep'], async (tx, profile) => {
    const [region] = await tx.select().from(regions).where(eq(regions.cityLeaderProfileId, profile.id));
    if (!region) throw new AuthError(404, 'Nenhuma praça associada a este City Leader.');

    const [regionChapters, regionCompanies, myCommissions] = await Promise.all([
      tx.select().from(chapters).where(eq(chapters.regionId, region.id)),
      tx.select().from(companies).where(eq(companies.regionId, region.id)),
      tx.select().from(commissions).where(eq(commissions.beneficiaryProfileId, profile.id)),
    ]);

    const chapterIds = regionChapters.map((c) => c.id);
    const regionSeats = chapterIds.length ? await tx.select().from(seats).where(inArray(seats.chapterId, chapterIds)) : [];
    const commissionTotal = myCommissions.reduce((sum, c) => sum + Number(c.amount), 0);

    return NextResponse.json({
      region,
      chapters: regionChapters,
      companies: regionCompanies,
      seats: regionSeats,
      seatsOccupied: regionSeats.filter((s) => s.status === 'occupied').length,
      seatsTotal: regionSeats.length,
      commissionMonthTotal: commissionTotal,
      commissions: myCommissions,
    });
  }),
);
