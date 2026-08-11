'use client';

import Link from 'next/link';
import { useFetch } from '@/lib/useFetch';
import { Card, GoldButton, GhostButton, Kicker, ProgressBar } from '@/components/ui/Primitives';
import { ViewHeader } from '@/components/dashboard/ViewHeader';
import { Loading, ErrorState } from '@/components/dashboard/Loading';
import type { Company, MethodStepWithProgress } from '@/lib/api-types';
import { PLAN_LADDER, WHATSAPP_CONTACT } from '@/lib/plans';

export function MemberHome() {
  const company = useFetch<Company>('/api/me/company');
  const steps = useFetch<MethodStepWithProgress[]>(company.notFound ? null : '/api/me/method-progress');

  if (company.loading) return <Loading />;

  if (company.notFound) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <Kicker>PASSO 1 — DIAGNOSTICAR</Kicker>
        <h2 className="mt-2 font-display text-xl font-bold text-white">Cadastre sua empresa para começar</h2>
        <p className="mt-2 text-sm text-text-tertiary">Sua esteira de 7 passos é criada assim que a empresa entra no método.</p>
        <Link href="/dashboard/setup">
          <GoldButton className="mt-5">Cadastrar empresa</GoldButton>
        </Link>
      </Card>
    );
  }

  if (company.error) return <ErrorState message={company.error} />;
  const c = company.data!;
  const plan = PLAN_LADDER.find((p) => p.code === c.planCode);
  const stepList = steps.data ?? [];
  const doneCount = stepList.filter((s) => s.progress?.status === 'done').length;
  const current = stepList.find((s) => s.progress?.status === 'doing' || s.progress?.status === 'next');

  return (
    <div>
      <ViewHeader title="MY 7M Advisory" subtitle="Seu Growth Office — visão da sua empresa" />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <Card className="border-gold/25 bg-gradient-to-br from-[#1a1608] to-navy-elevated">
          <Kicker>Sua evolução no Método 7M</Kicker>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-display text-6xl font-bold text-white">{doneCount}</span>
            <span className="font-display text-2xl font-bold text-text-muted">/7</span>
          </div>
          <div className="mt-4 flex flex-col gap-2.5">
            {steps.loading && <div className="text-sm text-text-muted">Carregando passos…</div>}
            {stepList.map((s) => {
              const accent = s.phase === 'Topo' || s.phase === 'Escalar' ? '#E9611A' : s.phase === 'Crescer' ? '#E7C871' : '#8FB4FF';
              const done = s.progress?.status === 'done';
              return (
                <div key={s.n}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-semibold text-text-secondary">
                      {s.n}. {s.verb}
                    </span>
                    <span style={{ color: accent }}>{done ? '100%' : `${s.progress?.pct ?? 0}%`}</span>
                  </div>
                  <ProgressBar pct={done ? 100 : s.progress?.pct ?? 0} color={accent} />
                </div>
              );
            })}
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <Kicker>Próxima ação</Kicker>
            {current ? (
              <>
                <div className="mt-2 font-display text-xl font-bold leading-snug text-white">
                  Passo {current.n} — <span className="text-gold-light">{current.verb}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-text-tertiary">{current.description}</p>
                <p className="mt-2 text-xs text-text-muted">Conduzido por {current.specialistRole}.</p>
              </>
            ) : (
              <p className="mt-2 text-sm text-text-tertiary">Todos os passos concluídos — fale com seu especialista sobre os próximos ciclos.</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2.5">
              <a href={WHATSAPP_CONTACT} target="_blank" rel="noreferrer">
                <GoldButton>Falar com especialista</GoldButton>
              </a>
              <Link href="/dashboard/pipeline">
                <GhostButton>Ver esteira completa</GhostButton>
              </Link>
            </div>
          </Card>

          <Card>
            <div className="mb-3 font-display text-lg font-bold text-white">Sua empresa</div>
            <div className="space-y-2 text-sm">
              <Row label="Razão social" value={c.legalName} />
              {c.tradeName && <Row label="Nome fantasia" value={c.tradeName} />}
              <Row label="Setor" value={c.sector ?? '—'} />
              <Row label="CNPJ" value={c.cnpj ?? '—'} />
              <Row label="Plano" value={`${c.planCode} · ${plan?.priceLabel ?? ''}`} />
              <Row label="7M Verified" value={c.verified ? 'Verificado ✓' : 'Ainda não verificado'} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/[.05] pb-2">
      <span className="text-text-muted">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}
