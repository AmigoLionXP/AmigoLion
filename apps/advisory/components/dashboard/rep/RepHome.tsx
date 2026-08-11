'use client';

import Link from 'next/link';
import { useFetch } from '@/lib/useFetch';
import { ViewHeader } from '@/components/dashboard/ViewHeader';
import { Loading, ErrorState } from '@/components/dashboard/Loading';
import { Card, Kicker, GhostButton } from '@/components/ui/Primitives';
import type { RepRegionResponse } from '@/lib/api-types';
import { formatBRL } from '@/lib/api-types';

export function RepHome() {
  const { data, loading, error, notFound } = useFetch<RepRegionResponse>('/api/rep/region');

  if (loading) return <Loading />;
  if (notFound) return <ErrorState message="Nenhuma praça associada a este City Leader ainda — fale com a Advisory Admin." />;
  if (error) return <ErrorState message={error} />;
  const r = data!;

  return (
    <div>
      <ViewHeader title="Advisory Rep" subtitle={`Sua praça: ${r.region.name}${r.region.state ? ' · ' + r.region.state : ''}`} />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <Card className="border-blue/30 bg-gradient-to-br from-[#0d2136] to-navy-elevated">
          <Kicker color="text-blue">Sua praça</Kicker>
          <div className="mt-2 font-display text-2xl font-bold text-white">{r.region.name}</div>
          <div className="mt-4 flex flex-col gap-2.5 border-t border-white/[.08] pt-4 text-sm">
            <Row label="Status" value={r.region.status} />
            <Row label="Capítulos" value={String(r.chapters.length)} />
            <Row label="Empresas na praça" value={String(r.companies.length)} />
            <Row label="Seats ocupados" value={`${r.seatsOccupied} / ${r.seatsTotal}`} />
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <Kicker>Comissão do mês</Kicker>
              <div className="mt-1 font-display text-2xl font-bold text-white">{formatBRL(r.commissionMonthTotal)}</div>
            </Card>
            <Card>
              <Kicker>Empresas ativas</Kicker>
              <div className="mt-1 font-display text-2xl font-bold text-white">{r.companies.length}</div>
            </Card>
          </div>
          <Card>
            <div className="mb-3 font-display text-base font-bold text-white">Capítulos da sua praça</div>
            {!r.chapters.length && <p className="text-sm text-text-muted">Nenhum capítulo cadastrado ainda.</p>}
            <div className="flex flex-col gap-2">
              {r.chapters.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl border border-white/[.06] bg-white/[.02] px-4 py-2.5 text-sm">
                  <span className="font-semibold text-white">{c.name}</span>
                  <span className="font-mono text-xs text-text-muted">{c.meetingFrequency}</span>
                </div>
              ))}
            </div>
          </Card>
          <div className="flex gap-3">
            <Link href="/dashboard/rep/network">
              <GhostButton>Ver minha rede</GhostButton>
            </Link>
            <Link href="/dashboard/rep/commissions">
              <GhostButton>Ver comissões</GhostButton>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-muted">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}
