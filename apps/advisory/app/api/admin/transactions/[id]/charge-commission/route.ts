import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { withErrorHandling } from '@/lib/api-guard';
import { withAuth, AuthError } from '@/lib/auth';
import { getStripe } from '@/lib/stripe';
import { commissions, subscriptions, transactions } from '@/db/schema';

/**
 * POST /api/admin/transactions/:id/charge-commission — collects the platform's 1%-7% cut on an
 * intermediated deal by charging the origin company's saved Stripe payment method (the one on
 * file from their plan subscription). Requires the company to already have a Stripe customer —
 * i.e. to have gone through /api/checkout at least once — otherwise this returns 409 rather than
 * silently failing or fabricating a charge.
 */
export const POST = withErrorHandling(async (_req, { params }) =>
  withAuth(['admin'], async (tx) => {
    const [transaction] = await tx.select().from(transactions).where(eq(transactions.id, params.id));
    if (!transaction) throw new AuthError(404, 'Transação não encontrada.');
    if (!transaction.originCompanyId) throw new AuthError(409, 'Transação sem empresa de origem — não há quem cobrar.');

    const [directCommission] = await tx
      .select()
      .from(commissions)
      .where(eq(commissions.transactionId, transaction.id));
    if (!directCommission) throw new AuthError(404, 'Nenhuma comissão calculada para esta transação ainda.');

    const [sub] = await tx.select().from(subscriptions).where(eq(subscriptions.companyId, transaction.originCompanyId));
    if (!sub?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'A empresa de origem ainda não tem um Stripe Customer (nenhum checkout de assinatura foi concluído).' },
        { status: 409 },
      );
    }

    const stripe = getStripe();
    const customer = await stripe.customers.retrieve(sub.stripeCustomerId);
    const defaultPaymentMethod = !('deleted' in customer) ? customer.invoice_settings?.default_payment_method : null;
    if (!defaultPaymentMethod) {
      return NextResponse.json({ error: 'A empresa não tem um método de pagamento padrão salvo na Stripe.' }, { status: 409 });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(directCommission.amount) * 100),
      currency: 'brl',
      customer: sub.stripeCustomerId,
      payment_method: String(defaultPaymentMethod),
      off_session: true,
      confirm: true,
      description: `Comissão ${directCommission.ratePct}% — transação ${transaction.description}`,
      metadata: { transactionId: transaction.id, commissionId: directCommission.id },
    });

    return NextResponse.json({ paymentIntentId: paymentIntent.id, status: paymentIntent.status });
  }),
);
