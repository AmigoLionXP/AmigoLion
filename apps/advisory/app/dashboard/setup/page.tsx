'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, GoldButton, Kicker } from '@/components/ui/Primitives';

export default function SetupPage() {
  const router = useRouter();
  const [legalName, setLegalName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [sector, setSector] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/me/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          legalName,
          tradeName: tradeName || undefined,
          cnpj: cnpj ? cnpj.replace(/\D/g, '') : undefined,
          sector: sector || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Não foi possível cadastrar a empresa.');
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <Kicker>ENTRADA NO PASSO 1 — DIAGNOSTICAR</Kicker>
      <h1 className="mt-2 font-display text-2xl font-bold text-white">Cadastre sua empresa</h1>
      <p className="mt-2 text-sm text-text-tertiary">Assim que sua empresa entrar, seus 7 passos são inicializados e o passo 1 é liberado.</p>
      <Card className="mt-6">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-text-tertiary">Razão social</label>
            <input required value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder="Ex.: Padaria do Bairro Ltda." className="mt-1 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-white outline-none" />
          </div>
          <div>
            <label className="text-sm font-semibold text-text-tertiary">Nome fantasia (opcional)</label>
            <input value={tradeName} onChange={(e) => setTradeName(e.target.value)} placeholder="Ex.: Padaria do Bairro" className="mt-1 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-white outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-text-tertiary">CNPJ (opcional)</label>
              <input value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" className="mt-1 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-white outline-none" />
            </div>
            <div>
              <label className="text-sm font-semibold text-text-tertiary">Setor</label>
              <input value={sector} onChange={(e) => setSector(e.target.value)} placeholder="Ex.: Alimentação" className="mt-1 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-white outline-none" />
            </div>
          </div>
          {error && <p className="text-sm text-orange">{error}</p>}
          <GoldButton type="submit" disabled={loading} className="w-full">
            {loading ? 'Cadastrando…' : 'Entrar no Método 7M'}
          </GoldButton>
        </form>
      </Card>
    </div>
  );
}
