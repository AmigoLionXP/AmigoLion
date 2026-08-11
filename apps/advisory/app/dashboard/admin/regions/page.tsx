'use client';

import { useFetch } from '@/lib/useFetch';
import { ViewHeader } from '@/components/dashboard/ViewHeader';
import { Loading, ErrorState } from '@/components/dashboard/Loading';
import { Card } from '@/components/ui/Primitives';
import type { RegionWithCounts } from '@/lib/api-types';

const STATUS_LABEL: Record<string, string> = { pilot: 'Piloto', active: 'Ativa', planned: 'Planejada' };
const STATUS_BADGE: Record<string, string> = { pilot: 'bg-gold/15 text-gold-light', active: 'bg-green/15 text-green', planned: 'bg-white/10 text-text-tertiary' };

export default function AdminRegionsPage() {
  const { data, loading, error } = useFetch<RegionWithCounts[]>('/api/admin/regions');
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;
  const regions = data ?? [];

  return (
    <div>
      <ViewHeader title="Praças & capítulos" subtitle="Onde a 7M Advisory está presente — arquitetura Praça → Capítulo → Seat" />
      {!regions.length && <p className="text-sm text-text-muted">Nenhuma praça cadastrada ainda.</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {regions.map((r) => (
          <Card key={r.id}>
            <div className="flex items-start justify-between gap-2">
              <div className="font-display text-lg font-bold text-white">{r.name}</div>
              <span className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] ${STATUS_BADGE[r.status]}`}>{STATUS_LABEL[r.status]}</span>
            </div>
            <div className="mt-1 text-xs text-text-muted">
              {r.state ? `${r.state} · ` : ''}
              {r.country}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/[.06] pt-4 text-sm">
              <div>
                <div className="font-display text-xl font-bold text-white">{r.chapterCount}</div>
                <div className="text-xs text-text-muted">capítulos</div>
              </div>
              <div>
                <div className="font-display text-xl font-bold text-white">{r.companyCount}</div>
                <div className="text-xs text-text-muted">empresas</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
