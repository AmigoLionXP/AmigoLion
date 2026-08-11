'use client';

import { useState } from 'react';
import { useFetch } from '@/lib/useFetch';
import { ViewHeader } from '@/components/dashboard/ViewHeader';
import { Loading, ErrorState } from '@/components/dashboard/Loading';
import { Card, GoldButton, Kicker } from '@/components/ui/Primitives';
import { GIVE7_TYPES } from '@/lib/plans';
import type { Give7Referral } from '@/lib/api-types';

export default function NetworkPage() {
  const { data, loading, error, notFound, reload } = useFetch<{ given: Give7Referral[]; received: Give7Referral[] }>('/api/me/give7');
  const [typeN, setTypeN] = useState(1);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      const res = await fetch('/api/me/give7', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ typeN, description }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Não foi possível registrar.');
      setDescription('');
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro inesperado.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Loading />;
  if (notFound) return <ErrorState message="Cadastre sua empresa primeiro em Minha empresa." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      <ViewHeader title="Rede 7M · Circle" subtitle="Give 7 — Get 7: sete formas de gerar valor na rede" />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <div className="mb-4 font-display text-lg font-bold text-white">Registrar um Give 7</div>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-text-tertiary">Tipo</label>
              <select value={typeN} onChange={(e) => setTypeN(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-white outline-none">
                {GIVE7_TYPES.map((t) => (
                  <option key={t.n} value={t.n} className="bg-navy">
                    {t.n}. {t.title} — {t.description}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-text-tertiary">O que você está oferecendo?</label>
              <textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-white outline-none" placeholder="Ex.: Indiquei um cliente para..." />
            </div>
            {formError && <p className="text-sm text-orange">{formError}</p>}
            <GoldButton type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Enviando…' : 'Registrar'}
            </GoldButton>
          </form>
        </Card>

        <div className="space-y-4">
          <Card>
            <Kicker>DADOS</Kicker>
            <div className="mt-2 font-display text-lg font-bold text-white">Você deu {data?.given.length ?? 0} · recebeu {data?.received.length ?? 0}</div>
          </Card>
          <Card>
            <div className="mb-3 font-display text-base font-bold text-white">Enviados por você</div>
            {!data?.given.length && <p className="text-sm text-text-muted">Nenhum ainda.</p>}
            <div className="flex flex-col gap-2">
              {data?.given.map((g) => (
                <ReferralRow key={g.id} r={g} />
              ))}
            </div>
          </Card>
          <Card>
            <div className="mb-3 font-display text-base font-bold text-white">Recebidos</div>
            {!data?.received.length && <p className="text-sm text-text-muted">Nenhum ainda.</p>}
            <div className="flex flex-col gap-2">
              {data?.received.map((g) => (
                <ReferralRow key={g.id} r={g} />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ReferralRow({ r }: { r: Give7Referral }) {
  const type = GIVE7_TYPES.find((t) => t.n === r.typeN);
  return (
    <div className="rounded-xl border border-white/[.06] bg-white/[.02] px-4 py-3">
      <div className="font-mono text-[11px] text-gold">{type?.title ?? `Tipo ${r.typeN}`}</div>
      <div className="mt-1 text-sm text-text-secondary">{r.description}</div>
    </div>
  );
}
