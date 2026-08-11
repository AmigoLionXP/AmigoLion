'use client';

import { ViewHeader } from '@/components/dashboard/ViewHeader';
import { PLAN_LADDER } from '@/lib/plans';

export default function AdminArchPage() {
  return (
    <div>
      <ViewHeader title="Arquitetura de expansão" subtitle="Do CNPJ à rede global — modelo de níveis, preço e comissão" />
      <div className="flex flex-col gap-3">
        {[...PLAN_LADDER].reverse().map((p) => (
          <div key={p.code} className="flex flex-col gap-3 rounded-2xl border border-white/[.08] bg-white/[.02] p-5 md:flex-row md:items-center md:gap-6" style={{ borderLeft: `5px solid ${p.accent}` }}>
            <div className="font-mono text-xl font-bold md:w-16" style={{ color: p.accent }}>{p.code}</div>
            <div className="font-display text-lg font-bold text-white md:w-48">{p.name}</div>
            <div className="flex-1 text-sm text-text-tertiary">{p.description}</div>
            <div className="flex-shrink-0 text-right">
              <div className="font-display text-lg font-bold text-gold-light">{p.priceLabel}</div>
              <div className="font-mono text-[11px] text-text-muted">
                {p.commissionPct > 0 ? `+ ${p.commissionPct}% comissão · ` : ''}
                {p.scaleLabel}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
