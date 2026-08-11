import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { withErrorHandling } from '@/lib/api-guard';
import { withAuth, AuthError } from '@/lib/auth';
import { getStripe } from '@/lib/stripe';
import { companies, plans, subscriptions } from '@/db/schema';
import { checkoutCreateSchema } from '@/lib/validation';

/**
 * POST /api/checkout — creates a Stripe Checkout Session for one of the 7M0-7M7 plans.
 * `plans.stripePriceId` must be set (via the Stripe dashboard or `stripe products create`) —
 * until then this returns a clear 409 instead of a confusing Stripe API error, same pattern as
 * the marketplace integration stubs: never pretend a real payment flow exists when it doesn't.
 */
export const POST = withErrorHandling(async (req) => {
  const body = checkoutCreateSchema.parse(await req.json());
  const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  return withAuth(['member'], async (tx, profile) => {
    const [company] = await tx.select().from(companies).where(eq(companies.ownerProfileId, profile.id));
    if (!company) throw new AuthError(404, 'Empresa não encontrada para este usuário.');

    const [plan] = await tx.select().from(plans).where(eq(plans.code, body.planCode));
    if (!plan) throw new AuthError(404, 'Plano inválido.');
    if (!plan.stripePriceId) {
      return NextResponse.json(
        { error: `O plano ${plan.code} ainda não tem um Stripe Price configurado. Cadastre-o no dashboard da Stripe e grave o price_id em plans.stripe_price_id.` },
        { status: 409 },
      );
    }

    const stripe = getStripe();
    const [existingSub] = await tx.select().from(subscriptions).where(eq(subscriptions.companyId, company.id));

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      customer: existingSub?.stripeCustomerId ?? undefined,
      customer_email: existingSub?.stripeCustomerId ? undefined : profile.email,
      client_reference_id: company.id,
      metadata: { companyId: company.id, planCode: plan.code },
      subscription_data: { metadata: { companyId: company.id, planCode: plan.code } },
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/dashboard?checkout=canceled`,
    });

    return NextResponse.json({ url: session.url });
  });
});
