'use client';

import { useFetch } from '@/lib/useFetch';
import { ViewHeader } from '@/components/dashboard/ViewHeader';
import { METHOD_STEPS } from '@/lib/method-content';
import type { MethodStepWithProgress } from '@/lib/api-types';

export default function MethodPage() {
  const { data } = useFetch<MethodStepWithProgress[]>('/api/me/method-progress');
  const progressByStep = new Map((data ?? []).map((s) => [s.n, s.progress]));

  return (
    <div>
      <ViewHeader title="O Método 7M" subtitle="Seus 7 passos — do diagnóstico ao patrimônio" />
      <div className="mb-6 rounded-2xl border border-gold/25 bg-gradient-to-br from-[#1a1608] to-navy-elevated p-6">
        <div className="font-display text-lg font-bold text-white">Cada passo é conduzido por um especialista humano + um agente de IA</div>
        <p className="mt-1 text-sm text-text-tertiary">Você avança no ritmo da sua empresa — o passo seguinte só destrava quando o atual é concluído.</p>
      </div>
      <div className="flex flex-col gap-3">
        {METHOD_STEPS.map((s) => {
          const status = progressByStep.get(s.n)?.status;
          return (
            <div key={s.n} className="flex flex-col gap-3 rounded-2xl border border-white/[.08] bg-white/[.02] p-5 md:flex-row md:items-center md:gap-6" style={{ borderLeft: `5px solid ${s.accent}` }}>
              <div className="font-serif text-4xl italic" style={{ color: s.accent }}>{s.n}</div>
              <div className="md:w-36">
                <div className="font-display text-lg font-bold text-white">{s.verb}</div>
                <div className="font-mono text-[11px] uppercase tracking-wide" style={{ color: s.accent }}>{s.phase}</div>
              </div>
              <div className="flex-1 text-sm text-text-secondary">{s.desc}</div>
              <div className="font-mono text-xs text-text-muted md:w-40 md:text-right">{s.owner}</div>
              {status && (
                <span className="flex-shrink-0 rounded-full bg-white/5 px-3 py-1 font-mono text-[11px] text-text-tertiary">
                  {status === 'done' ? 'Concluído' : status === 'doing' ? 'Em andamento' : status === 'next' ? 'Próximo' : 'Bloqueado'}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
