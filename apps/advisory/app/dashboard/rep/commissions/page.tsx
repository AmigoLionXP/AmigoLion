'use client';

import { useFetch } from '@/lib/useFetch';
import { ViewHeader } from '@/components/dashboard/ViewHeader';
import { Loading, ErrorState } from '@/components/dashboard/Loading';
import { Card, Kicker } from '@/components/ui/Primitives';
import type { RepRegionResponse } from '@/lib/api-types';
import { formatBRL } from '@/lib/api-types';

export default function RepCommissionsPage() {
  const { data, loading, error, notFound } = useFetch<RepRegionResponse>('/api/rep/region');
  if (loading) return <Loading />;
  if (notFound) return <ErrorState message="Nenhuma praça associada a este City Leader ainda." />;
  if (error) return <ErrorState message={error} />;
  const r = data!;
  const direct = r.commissions.filter((c) => c.type === 'direct');
  const network = r.commissions.filter((c) => c.type === 'network');

  return (
    <div>
      <ViewHeader title="Minhas comissões" subtitle="Comissões geradas por transações intermediadas na sua praça" />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <Kicker>Total do período</Kicker>
          <div className="mt-1 font-display text-3xl font-bold text-white">{formatBRL(r.commissionMonthTotal)}</div>
        </Card>
        <Card>
          <Kicker>Diretas</Kicker>
          <div className="mt-1 font-display text-3xl font-bold text-white">{direct.length}</div>
        </Card>
        <Card>
          <Kicker>Override de rede</Kicker>
          <div className="mt-1 font-display text-3xl font-bold text-white">{network.length}</div>
        </Card>
      </div>

      <Card>
        <div className="mb-4 font-display text-base font-bold text-white">Histórico</div>
        {!r.commissions.length && <p className="text-sm text-text-muted">Nenhuma comissão registrada ainda.</p>}
        <div className="flex flex-col gap-2">
          {r.commissions.map((c) => (
            <div key={c.id} className="flex items-center gap-4 rounded-xl border border-white/[.06] bg-white/[.02] px-4 py-3 text-sm">
              <span className="flex-1 font-semibold text-white">{c.type === 'direct' ? 'Comissão direta' : 'Override de rede'}</span>
              <span className="font-mono text-xs text-text-muted">{new Date(c.createdAt).toLocaleDateString('pt-BR')}</span>
              <span className="font-mono text-xs text-blue">× {c.ratePct}%</span>
              <span className="w-24 text-right font-display font-bold text-green">{formatBRL(Number(c.amount))}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-text-muted">
          A 7M Advisory fatura as assinaturas e transações intermediadas e repassa sua comissão sobre o volume da rede que
          você lidera.
        </p>
      </Card>
    </div>
  );
}
