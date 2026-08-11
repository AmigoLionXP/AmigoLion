'use client';

import { useState } from 'react';
import { useFetch } from '@/lib/useFetch';
import { ViewHeader } from '@/components/dashboard/ViewHeader';
import { Loading, ErrorState } from '@/components/dashboard/Loading';
import { Card, GoldButton, GhostButton } from '@/components/ui/Primitives';
import type { AdminUser, Transaction, VerificationRequest } from '@/lib/api-types';
import { formatBRL } from '@/lib/api-types';
import { PLAN_LADDER } from '@/lib/plans';

const ROLE_BADGE: Record<string, string> = { admin: 'bg-gold/15 text-gold-light', rep: 'bg-blue/15 text-blue', member: 'bg-white/10 text-text-tertiary' };

export default function AdminUsersPage() {
  const users = useFetch<AdminUser[]>('/api/admin/users');
  const verifications = useFetch<VerificationRequest[]>('/api/admin/verifications');
  const transactions = useFetch<Transaction[]>('/api/admin/transactions');

  if (users.loading || transactions.loading) return <Loading />;
  if (users.error) return <ErrorState message={users.error} />;

  return (
    <div>
      <ViewHeader title="Advisory Admin" subtitle="Usuários, permissões, verificações, comissões e transações" />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-4">
          <Card>
            <div className="mb-3 font-display text-base font-bold text-white">Usuários & permissões</div>
            <div className="flex flex-col gap-2">
              {(users.data ?? []).map((u) => (
                <div key={u.id} className="flex items-center gap-4 rounded-xl border border-white/[.06] bg-white/[.02] px-4 py-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a1c24] to-[#2a2d38] font-display text-sm font-bold text-gold-light">
                    {u.fullName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-[140px] flex-1">
                    <div className="font-semibold text-white">{u.fullName}</div>
                    <div className="text-xs text-text-muted">{u.email}</div>
                  </div>
                  <span className={`flex-shrink-0 rounded-full px-2.5 py-1 font-mono text-[11px] ${ROLE_BADGE[u.role]}`}>{u.role}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="mb-1 font-display text-base font-bold text-white">Transações intermediadas</div>
            {transactions.error && <ErrorState message={transactions.error} />}
            <div className="mt-3 flex flex-col gap-2.5">
              {(transactions.data ?? []).map((t) => (
                <TransactionRow key={t.id} tx={t} onCharged={transactions.reload} />
              ))}
              {!transactions.data?.length && <p className="text-sm text-text-muted">Nenhuma transação registrada ainda.</p>}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <div className="mb-3 font-display text-base font-bold text-white">Parâmetros de comissão</div>
            <div className="flex flex-col gap-2">
              {PLAN_LADDER.map((p) => (
                <div key={p.code} className="flex items-center justify-between text-sm">
                  <span className="font-mono" style={{ color: p.accent }}>{p.code}</span>
                  <span className="text-text-tertiary">{p.priceLabel}</span>
                  <span className="font-display font-bold text-gold-light">{p.commissionPct}%</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="mb-3 font-display text-base font-bold text-white">7M Verified — pendentes</div>
            {verifications.loading && <p className="text-sm text-text-muted">Carregando…</p>}
            {!verifications.loading && !verifications.data?.length && <p className="text-sm text-text-muted">Nenhuma solicitação pendente.</p>}
            <div className="flex flex-col gap-2">
              {(verifications.data ?? []).map((v) => (
                <VerificationRow key={v.id} v={v} onReviewed={verifications.reload} />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TransactionRow({ tx, onCharged }: { tx: Transaction; onCharged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const totalCommission = tx.commissions.reduce((s, c) => s + Number(c.amount), 0);

  async function charge() {
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch(`/api/admin/transactions/${tx.id}/charge-commission`, { method: 'POST' });
      const body = await res.json();
      setMsg(res.ok ? `Cobrança criada (${body.status})` : body.error);
      onCharged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/[.06] bg-white/[.02] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">{tx.description}</div>
          <div className="text-xs text-text-muted">{tx.status}</div>
        </div>
        <div className="text-right">
          <div className="font-display font-bold text-white">{formatBRL(Number(tx.amount))}</div>
          <div className="text-xs text-green">comissão {formatBRL(totalCommission)}</div>
        </div>
      </div>
      {tx.status === 'confirmed' && (
        <div className="mt-2 flex items-center gap-3">
          <GhostButton onClick={charge} className="px-3 py-1.5 text-xs">
            {busy ? 'Cobrando…' : 'Cobrar comissão'}
          </GhostButton>
          {msg && <span className="text-xs text-text-muted">{msg}</span>}
        </div>
      )}
    </div>
  );
}

function VerificationRow({ v, onReviewed }: { v: VerificationRequest; onReviewed: () => void }) {
  const [busy, setBusy] = useState(false);

  async function review(status: 'approved' | 'rejected') {
    setBusy(true);
    try {
      await fetch(`/api/admin/verifications/${v.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      onReviewed();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/[.06] bg-white/[.02] px-4 py-3">
      <div className="text-sm font-semibold text-white">{v.companyName}</div>
      <div className="text-xs text-text-muted">{v.companySector ?? '—'}</div>
      <div className="mt-2 flex gap-2">
        <GoldButton onClick={() => review('approved')} disabled={busy} className="px-3 py-1.5 text-xs">
          Aprovar
        </GoldButton>
        <GhostButton onClick={() => review('rejected')} className="px-3 py-1.5 text-xs">
          Rejeitar
        </GhostButton>
      </div>
    </div>
  );
}
