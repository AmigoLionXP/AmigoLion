'use client';

import { useState } from 'react';
import { ViewHeader } from '@/components/dashboard/ViewHeader';
import { Card, Kicker } from '@/components/ui/Primitives';
import { PLAN_LADDER } from '@/lib/plans';
import { formatBRL } from '@/lib/api-types';

const NETWORK_PLANS = PLAN_LADDER.filter((p) => p.code !== '7M0');

export default function SimulatorPage() {
  const [counts, setCounts] = useState<Record<string, number>>({ '7M1': 6, '7M2': 4, '7M3': 2, '7M4': 1, '7M5': 1, '7M6': 0, '7M7': 0 });
  const [avgVolume, setAvgVolume] = useState(40000);

  const totalCompanies = Object.values(counts).reduce((a, b) => a + b, 0);
  const fees = NETWORK_PLANS.reduce((sum, p) => sum + (counts[p.code] ?? 0) * p.priceCents, 0);
  const commissions = NETWORK_PLANS.reduce((sum, p) => sum + (counts[p.code] ?? 0) * avgVolume * (p.commissionPct / 100), 0);
  const totalMonth = fees / 100 + commissions;

  return (
    <div>
      <ViewHeader title="Simulador de receita" subtitle="Projete mensalidades + comissões de uma carteira por nível" />
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <div className="mb-1 font-display text-lg font-bold text-white">Carteira por nível</div>
          <p className="mb-5 text-sm text-text-muted">Informe quantas empresas em cada nível e o volume médio intermediado por empresa/mês.</p>
          <div className="flex flex-col gap-2.5">
            {NETWORK_PLANS.map((p) => (
              <div key={p.code} className="flex items-center gap-4 rounded-xl border border-white/[.06] bg-white/[.02] px-4 py-3" style={{ borderLeft: `4px solid ${p.accent}` }}>
                <div className="w-28 flex-shrink-0">
                  <div className="font-mono text-sm font-bold" style={{ color: p.accent }}>{p.code}</div>
                  <div className="text-xs text-text-muted">
                    {p.priceLabel} · {p.commissionPct}%
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCounts((c) => ({ ...c, [p.code]: Math.max(0, c[p.code] - 1) }))} className="h-8 w-8 rounded-lg border border-white/10 bg-white/5 text-lg text-white">
                    −
                  </button>
                  <div className="w-9 text-center font-display text-lg font-bold text-white">{counts[p.code] ?? 0}</div>
                  <button onClick={() => setCounts((c) => ({ ...c, [p.code]: c[p.code] + 1 }))} className="h-8 w-8 rounded-lg border border-white/10 bg-white/5 text-lg text-white">
                    +
                  </button>
                </div>
                <div className="flex-1" />
                <div className="text-right">
                  <div className="font-display text-sm font-bold text-gold-light">
                    {formatBRL((counts[p.code] ?? 0) * (p.priceCents / 100) + (counts[p.code] ?? 0) * avgVolume * (p.commissionPct / 100))}
                  </div>
                  <div className="font-mono text-[10px] text-text-muted">mens. + comissão/mês</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5">
            <div className="mb-1.5 flex justify-between text-sm text-text-tertiary">
              <span>Volume médio intermediado por empresa/mês</span>
              <span className="font-bold text-gold-light">{formatBRL(avgVolume)}</span>
            </div>
            <input type="range" min={0} max={200000} step={5000} value={avgVolume} onChange={(e) => setAvgVolume(Number(e.target.value))} className="w-full accent-gold" />
          </div>
        </Card>

        <div className="flex flex-col gap-3.5">
          <Card className="border-gold/30 bg-gradient-to-br from-gold/[.14] to-transparent">
            <Kicker color="text-gold-light">Receita mensal total</Kicker>
            <div className="mt-1 font-display text-4xl font-bold text-white">{formatBRL(totalMonth)}</div>
            <div className="text-sm text-text-tertiary">{totalCompanies} empresas · projeção mensal recorrente</div>
          </Card>
          <Card>
            <div className="flex items-center justify-between border-b border-white/[.06] pb-3">
              <span className="text-sm text-text-tertiary">Mensalidades</span>
              <span className="font-display text-lg font-bold text-white">{formatBRL(fees / 100)}</span>
            </div>
            <div className="flex items-center justify-between pt-3">
              <span className="text-sm text-text-tertiary">Comissões (1–7%)</span>
              <span className="font-display text-lg font-bold text-white">{formatBRL(commissions)}</span>
            </div>
          </Card>
          <Card>
            <div className="text-sm text-text-muted">Projeção anual</div>
            <div className="mt-1 font-display text-2xl font-bold text-green">{formatBRL(totalMonth * 12)}</div>
          </Card>
        </div>
      </div>
    </div>
  );
}
