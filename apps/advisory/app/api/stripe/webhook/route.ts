import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { eq } from 'drizzle-orm';
import { getStripe } from '@/lib/stripe';
import { db } from '@/db/client';
import { subscriptions } from '@/db/schema';

// Needs the raw request body for signature verification, and Node's crypto — not the edge runtime.
export const runtime = 'nodejs';

/**
 * POST /api/stripe/webhook — syncs `subscriptions` from Stripe's own source of truth.
 * This is the ONE place allowed to write subscription status without going through
 * `runAsUser`/RLS: Stripe authenticates the call via the signed payload (STRIPE_WEBHOOK_SECRET),
 * not via a Supabase session, so it uses the privileged `db` connection directly — same trust
 * boundary as a migration script, not a user request.
 */
export async function POST(req: Request) {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Webhook não configurado (STRIPE_WEBHOOK_SECRET ausente).' }, { status: 500 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: `Assinatura inválida: ${(err as Error).message}` }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const companyId = session.metadata?.companyId;
      const planCode = session.metadata?.planCode as (typeof subscriptions.$inferInsert)['planCode'] | undefined;
      if (companyId && planCode && session.subscription && session.customer) {
        await db
          .insert(subscriptions)
          .values({
            companyId,
            planCode,
            status: 'active',
            stripeCustomerId: String(session.customer),
            stripeSubscriptionId: String(session.subscription),
          })
          .onConflictDoUpdate({
            target: subscriptions.companyId,
            set: {
              planCode,
              status: 'active',
              stripeCustomerId: String(session.customer),
              stripeSubscriptionId: String(session.subscription),
              updatedAt: new Date(),
            },
          });
      }
      break;
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const status = mapStripeStatus(sub.status);
      await db
        .update(subscriptions)
        .set({
          status,
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.stripeSubscriptionId, sub.id));
      break;
    }

    default:
      break; // Other event types aren't relevant to subscription state.
  }

  return NextResponse.json({ received: true });
}

function mapStripeStatus(status: Stripe.Subscription.Status): (typeof subscriptions.$inferInsert)['status'] {
  switch (status) {
    case 'active':
      return 'active';
    case 'trialing':
      return 'trialing';
    case 'past_due':
      return 'past_due';
    case 'canceled':
    case 'unpaid':
    case 'incomplete_expired':
      return 'canceled';
    default:
      return 'incomplete';
  }
}
