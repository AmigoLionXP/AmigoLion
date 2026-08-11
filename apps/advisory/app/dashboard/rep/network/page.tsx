'use client';

import { useFetch } from '@/lib/useFetch';
import { ViewHeader } from '@/components/dashboard/ViewHeader';
import { Loading, ErrorState } from '@/components/dashboard/Loading';
import { Card } from '@/components/ui/Primitives';
import type { RepRegionResponse } from '@/lib/api-types';
import { PLAN_LADDER } from '@/lib/plans';

export default function RepNetworkPage() {
  const { data, loading, error, notFound } = useFetch<RepRegionResponse>('/api/rep/region');
  if (loading) return <Loading />;
  if (notFound) return <ErrorState message="Nenhuma praça associada a este City Leader ainda." />;
  if (error) return <ErrorState message={error} />;
  const r = data!;

  return (
    <div>
      <ViewHeader title="Minha rede" subtitle="Empresas na sua praça" />
      <Card>
        {!r.companies.length && <p className="text-sm text-text-muted">Nenhuma empresa na sua praça ainda.</p>}
        <div className="flex flex-col gap-2">
          {r.companies.map((c) => {
            const plan = PLAN_LADDER.find((p) => p.code === c.planCode);
            return (
              <div key={c.id} className="flex items-center gap-4 rounded-xl border border-white/[.06] bg-white/[.02] px-4 py-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a2350] to-[#2a3568] font-display font-bold text-blue">
                  {c.legalName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-[150px] flex-1">
                  <div className="font-display font-bold text-white">{c.tradeName ?? c.legalName}</div>
                  <div className="text-xs text-text-muted">{c.sector ?? '—'}</div>
                </div>
                <span className="flex-shrink-0 rounded-full bg-blue/10 px-3 py-1 font-mono text-xs text-blue">{c.planCode}</span>
                <div className="flex-shrink-0 text-right">
                  <div className="font-display text-sm font-bold text-white">{plan?.priceLabel ?? '—'}</div>
                  <div className="font-mono text-[10px] text-text-muted">assinatura</div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
