import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/api-guard';
import { wizardSubmitSchema } from '@/lib/validation';
import { resolveWizardOutcome } from '@/lib/wizard-logic';
import { runAsUser } from '@/db/rls-context';
import { wizardLeads } from '@/db/schema';
import { getAuthedUser } from '@/lib/auth';
import { emailTemplates, getEmailProvider } from '@/lib/providers/email';

/**
 * POST /api/wizard — public funil de convicção. Anonymous visitors can submit (RLS policy
 * `wizard_leads_insert_anyone`); if the visitor happens to already be signed in as a Member,
 * their lead is linked to their session so an Admin can see it wasn't a cold lead.
 *
 * The id is generated here rather than via `.returning()`: Postgres requires SELECT privilege
 * for a RETURNING clause, and `anon` deliberately has none on wizard_leads (only Admin can read
 * leads back — see wizard_leads_select_admin) — this is RLS working as intended, not a bug to
 * route around by widening anon's read access.
 */
export const POST = withErrorHandling(async (req) => {
  const body = wizardSubmitSchema.parse(await req.json());
  const outcome = resolveWizardOutcome(body.challenge);
  const user = await getAuthedUser();
  const id = randomUUID();

  await runAsUser(user?.id ?? null, (tx) =>
    tx.insert(wizardLeads).values({
      id,
      name: body.name,
      email: body.email,
      sector: body.sector,
      companyAge: body.companyAge,
      revenueRange: body.revenueRange,
      challenge: body.challenge,
      suggestedPlan: outcome.plan,
      suggestedStep: outcome.step,
      suggestedSpecialist: outcome.spec,
      scheduledDay: body.scheduledDay,
      scheduledSlot: body.scheduledSlot,
      scheduledFormat: body.scheduledFormat,
    }),
  );

  // Best-effort — a delivery hiccup here shouldn't fail the wizard submission itself.
  getEmailProvider()
    .send({ to: body.email, ...emailTemplates.wizardConfirmation(body.name, outcome.plan, outcome.spec) })
    .catch((err) => console.error('wizard confirmation email failed:', err));

  return NextResponse.json({
    id,
    suggestedPlan: outcome.plan,
    suggestedStep: outcome.step,
    suggestedSpecialist: outcome.spec,
  });
});
