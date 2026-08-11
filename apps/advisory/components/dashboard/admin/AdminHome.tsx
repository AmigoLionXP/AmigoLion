'use client';

import { useFetch } from '@/lib/useFetch';
import { ViewHeader } from '@/components/dashboard/ViewHeader';
import { Loading, ErrorState } from '@/components/dashboard/Loading';
import { Card, Kpi } from '@/components/ui/Primitives';
import type { AdminMetrics, Company } from '@/lib/api-types';
import { formatCents } from '@/lib/api-types';
import { PLAN_LADDER } from '@/lib/plans';

export function AdminHome() {
  const metrics = useFetch<AdminMetrics>('/api/admin/metrics');
  const companies = useFetch<Company[]>('/api/admin/companies');

  if (metrics.loading || companies.loading) return <Loading />;
  if (metrics.error) return <ErrorState message={metrics.error} />;
  if (companies.error) return <ErrorState message={companies.error} />;
  const m = metrics.data!;
  const list = companies.data ?? [];

  return (
    <div>
      <ViewHeader title="Visão geral" subtitle="Todas as empresas na esteira do Método 7M" />

      <div className="mb-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Usuários ativos" value={String(m.activeUsers)} />
        <Kpi label="Empresas ativas" value={String(m.activeCompanies)} />
        <Kpi label="MRR" value={formatCents(m.mrrCents)} />
        <Kpi label="Transações no mês" value={String(m.transactionsThisMonth)} sub={`comissão média ${m.avgCommissionPct.toFixed(1)}%`} />
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div className="font-display text-lg font-bold text-white">Empresas na esteira</div>
          <div className="font-mono text-xs text-text-muted">{list.length} ativas</div>
        </div>
        {!list.length && <p className="text-sm text-text-muted">Nenhuma empresa cadastrada ainda.</p>}
        <div className="flex flex-col gap-2">
          {list.map((c) => {
            const plan = PLAN_LADDER.find((p) => p.code === c.planCode);
            return (
              <div key={c.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-white/[.06] bg-white/[.02] px-4 py-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a1c24] to-[#2a2d38] font-display font-bold text-gold-light">
                  {c.legalName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-[160px] flex-1">
                  <div className="font-display font-bold text-white">{c.legalName}</div>
                  <div className="text-xs text-text-muted">{c.sector ?? '—'}</div>
                </div>
                <span className="flex-shrink-0 rounded-full px-3 py-1 font-mono text-xs" style={{ background: `${plan?.accent}22`, color: plan?.accent }}>
                  {c.planCode}
                </span>
                <span className={`flex-shrink-0 rounded-full px-3 py-1 font-mono text-[11px] ${c.verified ? 'bg-green/15 text-green' : 'bg-white/10 text-text-tertiary'}`}>
                  {c.verified ? '7M Verified' : 'não verificado'}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
