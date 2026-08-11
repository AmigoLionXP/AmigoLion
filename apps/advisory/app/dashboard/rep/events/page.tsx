'use client';

import { useFetch } from '@/lib/useFetch';
import { ViewHeader } from '@/components/dashboard/ViewHeader';
import { Loading, ErrorState } from '@/components/dashboard/Loading';
import { Card, GoldButton } from '@/components/ui/Primitives';
import type { RepRegionResponse } from '@/lib/api-types';
import { WHATSAPP_CONTACT } from '@/lib/plans';

const FREQ_LABEL: Record<string, string> = { weekly: 'Semanal', biweekly: 'Quinzenal', monthly: 'Mensal' };

export default function RepEventsPage() {
  const { data, loading, error, notFound } = useFetch<RepRegionResponse>('/api/rep/region');
  if (loading) return <Loading />;
  if (notFound) return <ErrorState message="Nenhuma praça associada a este City Leader ainda." />;
  if (error) return <ErrorState message={error} />;
  const r = data!;

  return (
    <div>
      <ViewHeader title="Meus eventos" subtitle="Produza rounds de capítulo e apresente o Método 7M à sua praça" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {r.chapters.map((c) => (
          <Card key={c.id}>
            <div className="font-display text-lg font-bold text-white">{c.name}</div>
            <div className="mt-1 font-mono text-xs text-text-muted">Encontro {FREQ_LABEL[c.meetingFrequency]}</div>
            <a href={WHATSAPP_CONTACT} target="_blank" rel="noreferrer" className="mt-4 block">
              <GoldButton className="w-full">Produzir / convidar</GoldButton>
            </a>
          </Card>
        ))}
        {!r.chapters.length && <p className="text-sm text-text-muted">Nenhum capítulo cadastrado na sua praça ainda.</p>}
      </div>
      <p className="mt-6 text-xs text-text-muted">
        Agenda e inscrições de eventos por capítulo ainda não têm uma tela dedicada — combine data e formato pelo WhatsApp
        com seu apoio 7M Advisory por enquanto.
      </p>
    </div>
  );
}
