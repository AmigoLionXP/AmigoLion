'use client';

import { useFetch } from '@/lib/useFetch';
import { ViewHeader } from '@/components/dashboard/ViewHeader';
import { Loading, ErrorState } from '@/components/dashboard/Loading';
import { GoldButton } from '@/components/ui/Primitives';
import type { MethodStepWithProgress } from '@/lib/api-types';
import { useState } from 'react';

const STATUS_LABEL: Record<string, string> = { locked: 'Bloqueado', next: 'Próximo', doing: 'Em andamento', done: 'Concluído' };

export default function PipelinePage() {
  const { data, loading, error, notFound, reload } = useFetch<MethodStepWithProgress[]>('/api/me/method-progress');
  const [busy, setBusy] = useState<number | null>(null);

  async function advance(stepN: number, status: 'doing' | 'done') {
    setBusy(stepN);
    try {
      await fetch(`/api/me/method-progress/${stepN}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, pct: status === 'done' ? 100 : 40 }),
      });
      reload();
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <Loading />;
  if (notFound) return <ErrorState message="Cadastre sua empresa primeiro em Minha empresa." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      <ViewHeader title="Esteira dos 7 passos" subtitle="Do diagnóstico ao patrimônio — um passo destrava o próximo" />
      <div className="flex flex-col gap-3">
        {(data ?? []).map((s) => {
          const accent = s.phase === 'Topo' || s.phase === 'Escalar' ? '#E9611A' : s.phase === 'Crescer' ? '#E7C871' : '#8FB4FF';
          const status = s.progress?.status ?? 'locked';
          return (
            <div key={s.n} className="flex flex-col gap-3 rounded-2xl border border-white/[.08] bg-white/[.02] p-5 md:flex-row md:items-center md:gap-6" style={{ borderLeft: `5px solid ${accent}`, opacity: status === 'locked' ? 0.5 : 1 }}>
              <div className="font-serif text-4xl italic" style={{ color: accent }}>{s.n}</div>
              <div className="md:w-40">
                <div className="font-display text-lg font-bold text-white">{s.verb}</div>
                <div className="font-mono text-[11px] uppercase tracking-wide" style={{ color: accent }}>{s.phase}</div>
              </div>
              <div className="flex-1 text-sm text-text-secondary">{s.description}</div>
              <div className="font-mono text-xs text-text-muted md:w-40 md:text-right">{s.specialistRole}</div>
              <div className="flex flex-shrink-0 items-center gap-2">
                <span className="rounded-full bg-white/5 px-3 py-1 font-mono text-[11px] text-text-tertiary">{STATUS_LABEL[status]}</span>
                {status === 'next' && (
                  <GoldButton onClick={() => advance(s.n, 'doing')} disabled={busy === s.n} className="px-3 py-2 text-xs">
                    Iniciar
                  </GoldButton>
                )}
                {status === 'doing' && (
                  <GoldButton onClick={() => advance(s.n, 'done')} disabled={busy === s.n} className="px-3 py-2 text-xs">
                    Concluir
                  </GoldButton>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
