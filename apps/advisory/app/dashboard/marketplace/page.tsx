'use client';

import { useState } from 'react';
import { useFetch } from '@/lib/useFetch';
import { ViewHeader } from '@/components/dashboard/ViewHeader';
import { Loading, ErrorState } from '@/components/dashboard/Loading';
import { Card, GoldButton, GhostButton } from '@/components/ui/Primitives';
import type { AdminUser, Company, MarketplaceListing } from '@/lib/api-types';

const CATEGORY_LABEL: Record<string, string> = { product: 'Produto', service: 'Serviço', equipment: 'Equipamento' };
const STATUS_BADGE: Record<string, string> = { active: 'bg-green/15 text-green', pending_review: 'bg-gold/15 text-gold-light', paused: 'bg-white/10 text-text-tertiary', removed: 'bg-orange/15 text-orange' };

export default function MarketplacePage() {
  const me = useFetch<AdminUser & { hasCompany: boolean }>('/api/me');
  const company = useFetch<Company>(me.data?.role === 'member' ? '/api/me/company' : null);
  const { data, loading, error, reload } = useFetch<MarketplaceListing[]>('/api/marketplace');
  const [tab, setTab] = useState<'offer' | 'intent'>('offer');
  const [publishOpen, setPublishOpen] = useState(false);
  const isAdmin = me.data?.role === 'admin';

  if (loading || me.loading) return <Loading />;
  if (error) return <ErrorState message={error} />;

  const listings = (data ?? []).filter((l) => l.type === tab);

  return (
    <div>
      <ViewHeader
        title={isAdmin ? 'Moderar marketplace' : 'Marketplace'}
        subtitle={isAdmin ? 'Aprove, pause ou remova anúncios da rede' : 'Produtos, serviços e intenções de compra da rede'}
        action={
          !isAdmin &&
          company.data && (
            <GoldButton onClick={() => setPublishOpen(true)} className="px-4 py-2 text-sm">
              Publicar
            </GoldButton>
          )
        }
      />

      {isAdmin && (
        <div className="mb-6 flex items-center gap-4 rounded-2xl border border-gold/25 bg-gold/[.06] px-5 py-4">
          <span className="text-xl">🛡️</span>
          <div className="text-sm text-text-tertiary">
            Aprove anúncios pendentes ou remova conteúdo fora das regras. Transações fechadas geram comissão do nível do
            anunciante.
          </div>
          <div className="ml-auto font-mono text-xs text-gold-light">{(data ?? []).filter((l) => l.status === 'pending_review').length} pendentes</div>
        </div>
      )}

      <div className="mb-6 flex gap-2">
        <button onClick={() => setTab('offer')} className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === 'offer' ? 'bg-gold/15 text-gold-light' : 'bg-white/5 text-text-tertiary'}`}>
          Ofertas
        </button>
        <button onClick={() => setTab('intent')} className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === 'intent' ? 'bg-gold/15 text-gold-light' : 'bg-white/5 text-text-tertiary'}`}>
          Intenções de compra
        </button>
        <div className="ml-auto self-center font-mono text-xs text-text-muted">{listings.length} anúncios</div>
      </div>

      {!listings.length && <p className="text-sm text-text-muted">Nada por aqui ainda.</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((l) => (
          <ListingCard key={l.id} listing={l} isAdmin={isAdmin} isOwner={l.companyId === company.data?.id} onChanged={reload} />
        ))}
      </div>

      {publishOpen && <PublishModal onClose={() => setPublishOpen(false)} onPublished={reload} />}
    </div>
  );
}

function ListingCard({ listing, isAdmin, isOwner, onChanged }: { listing: MarketplaceListing; isAdmin: boolean; isOwner: boolean; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [interested, setInterested] = useState(false);

  async function patch(status: MarketplaceListing['status']) {
    setBusy(true);
    try {
      await fetch(`/api/marketplace/${listing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function expressInterest() {
    setBusy(true);
    try {
      const res = await fetch(`/api/marketplace/${listing.id}/interest`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      if (res.ok) setInterested(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="font-display text-base font-bold text-white">{listing.title}</div>
        {listing.priceLabel && <div className="flex-shrink-0 font-display font-bold text-gold-light">{listing.priceLabel}</div>}
      </div>
      <div className="flex gap-2">
        <span className="rounded-full bg-white/5 px-2.5 py-0.5 font-mono text-[10px] text-text-tertiary">{CATEGORY_LABEL[listing.category]}</span>
        <span className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] ${STATUS_BADGE[listing.status]}`}>{listing.status}</span>
      </div>
      <p className="text-sm text-text-tertiary">{listing.description}</p>
      {listing.location && <div className="font-mono text-[11px] text-text-muted">{listing.location}</div>}

      <div className="mt-2 flex flex-wrap gap-2">
        {isAdmin && listing.status === 'pending_review' && (
          <GoldButton onClick={() => patch('active')} disabled={busy} className="px-3 py-2 text-xs">
            Aprovar
          </GoldButton>
        )}
        {isAdmin && listing.status !== 'removed' && (
          <GhostButton onClick={() => patch('removed')} className="px-3 py-2 text-xs">
            Remover
          </GhostButton>
        )}
        {!isAdmin && !isOwner && listing.status === 'active' && (
          <GoldButton onClick={expressInterest} disabled={busy || interested} className="w-full px-3 py-2 text-xs">
            {interested ? 'Interesse enviado ✓' : 'Tenho interesse'}
          </GoldButton>
        )}
        {!isAdmin && isOwner && (
          <span className="font-mono text-[11px] text-text-muted">seu anúncio</span>
        )}
      </div>
    </Card>
  );
}

function PublishModal({ onClose, onPublished }: { onClose: () => void; onPublished: () => void }) {
  const [type, setType] = useState<'offer' | 'intent'>('offer');
  const [category, setCategory] = useState<'product' | 'service' | 'equipment'>('product');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceLabel, setPriceLabel] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, category, title, description, priceLabel: priceLabel || undefined, location: location || undefined }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Não foi possível publicar.');
      onPublished();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div onClick={(e) => e.stopPropagation()} className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-gold/25 bg-navy-elevated p-7">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-white">Publicar anúncio</h2>
          <button onClick={onClose} className="text-2xl text-text-muted">×</button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div className="flex gap-2">
            <button type="button" onClick={() => setType('offer')} className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold ${type === 'offer' ? 'bg-gold/15 text-gold-light' : 'bg-white/5 text-text-tertiary'}`}>
              Oferta
            </button>
            <button type="button" onClick={() => setType('intent')} className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold ${type === 'intent' ? 'bg-gold/15 text-gold-light' : 'bg-white/5 text-text-tertiary'}`}>
              Intenção de compra
            </button>
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value as typeof category)} className="w-full rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-white outline-none">
            <option className="bg-navy" value="product">Produto</option>
            <option className="bg-navy" value="service">Serviço</option>
            <option className="bg-navy" value="equipment">Equipamento</option>
          </select>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" className="w-full rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-white outline-none" />
          <textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Descrição" className="w-full rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-white outline-none" />
          <div className="grid grid-cols-2 gap-3">
            <input value={priceLabel} onChange={(e) => setPriceLabel(e.target.value)} placeholder="Preço (ex.: R$ 4,50/un)" className="w-full rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-white outline-none" />
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Localização" className="w-full rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-white outline-none" />
          </div>
          {error && <p className="text-sm text-orange">{error}</p>}
          <p className="text-xs text-text-muted">Anúncios entram como pendentes até revisão da 7M Advisory.</p>
          <GoldButton type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Publicando…' : 'Publicar'}
          </GoldButton>
        </form>
      </div>
    </div>
  );
}
