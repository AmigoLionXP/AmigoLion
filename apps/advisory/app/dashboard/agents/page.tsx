'use client';

import { ViewHeader } from '@/components/dashboard/ViewHeader';
import { Card, GoldButton } from '@/components/ui/Primitives';
import { METHOD_STEPS } from '@/lib/method-content';

const AGENT_FOCUS: Record<number, string> = {
  1: 'Coleta dados do negócio e monta o raio-x inicial que o especialista valida.',
  2: 'Mapeia processos que ainda dependem só do dono e sugere checklists de delegação.',
  3: 'Organiza fluxo de caixa e prepara a categorização que abre porta de crédito.',
  4: 'Acompanha funil de marketing e sinaliza onde o tráfego ou o checkout perdem gente.',
  5: 'Simula linhas de crédito e capital disponíveis para o porte da empresa.',
  6: 'Modela cenários de expansão — novas unidades, franquia, novos canais.',
  7: 'Monta o dossiê de valuation e governança para atrair sócio ou investidor.',
};

function openGuia7MAI() {
  window.dispatchEvent(new CustomEvent('open-7m-ai-chat'));
}

export default function AgentsPage() {
  return (
    <div>
      <ViewHeader
        title="Meus agentes de IA"
        subtitle="Um agente por passo, sempre supervisionado por um especialista humano"
        action={
          <GoldButton onClick={openGuia7MAI} className="px-4 py-2 text-sm">
            Falar com o Guia 7M AI
          </GoldButton>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {METHOD_STEPS.map((s) => (
          <Card key={s.n}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-gold-light text-lg text-navy">✦</div>
              <div>
                <div className="font-display text-base font-bold text-white">
                  Agente do Passo {s.n} · {s.verb}
                </div>
                <div className="text-xs text-text-muted">supervisionado por {s.owner}</div>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-text-tertiary">{AGENT_FOCUS[s.n]}</p>
          </Card>
        ))}
      </div>
      <p className="mt-6 text-xs text-text-muted">
        O agente coleta, analisa e recomenda; o especialista humano valida e decide. Insights específicos da sua empresa
        aparecem aqui conforme seu diagnóstico avança nos passos.
      </p>
    </div>
  );
}
