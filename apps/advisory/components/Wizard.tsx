'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoldButton, GhostButton } from './ui/Primitives';

const CHALLENGES = [
  { id: 'growth', label: 'Vender mais e atrair clientes', icon: '📈' },
  { id: 'finance', label: 'Organizar finanças e caixa', icon: '📊' },
  { id: 'owner', label: 'Sair da operação (tudo depende de mim)', icon: '🧭' },
  { id: 'capital', label: 'Acessar capital e crédito', icon: '💰' },
  { id: 'scale', label: 'Escalar e abrir novas unidades', icon: '🚀' },
  { id: 'legacy', label: 'Valorizar ou vender a empresa', icon: '🏆' },
] as const;

const AGES = ['Menos de 1 ano', '1 a 3 anos', '3 a 10 anos', 'Mais de 10 anos'] as const;
const REVENUES = ['Até R$ 20 mil/mês', 'R$ 20–100 mil', 'R$ 100–500 mil', 'Acima de R$ 500 mil'] as const;
const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
const SLOTS = ['09:00', '10:30', '14:00', '15:30', '17:00'];
const FORMATS = ['Vídeo-chamada', 'WhatsApp', 'Presencial · BH'] as const;

const STEP_LABELS = ['Boas-vindas', 'Seu desafio', 'Sua empresa', 'Seus dados', 'Agendar', 'Confirmado'];

type Result = { suggestedPlan: string; suggestedStep: number; suggestedSpecialist: string };

function chip(active: boolean) {
  return `rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors ${
    active ? 'border-gold/60 bg-gold/15 text-gold-light' : 'border-white/10 bg-white/[.03] text-text-tertiary hover:border-white/20'
  }`;
}

export function Wizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [challenge, setChallenge] = useState<string>('');
  const [companyAge, setCompanyAge] = useState<string>('');
  const [revenueRange, setRevenueRange] = useState<string>('');
  const [name, setName] = useState('');
  const [sector, setSector] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [scheduledDay, setScheduledDay] = useState('');
  const [scheduledSlot, setScheduledSlot] = useState('');
  const [scheduledFormat, setScheduledFormat] = useState<string>('Vídeo-chamada');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Result | null>(null);

  if (!open) return null;

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canNext = [true, !!challenge, true, !!name.trim() && emailOk && consent, true, true][step];

  async function submit() {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/wizard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          sector: sector || undefined,
          companyAge: companyAge || undefined,
          revenueRange: revenueRange || undefined,
          challenge,
          scheduledDay: scheduledDay || undefined,
          scheduledSlot: scheduledSlot || undefined,
          scheduledFormat: scheduledDay ? scheduledFormat : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Não foi possível enviar o diagnóstico.');
      setResult(data);
      setStep(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado.');
    } finally {
      setSubmitting(false);
    }
  }

  function next() {
    if (!canNext) return;
    if (step === 4) submit();
    else setStep((s) => s + 1);
  }

  function reset() {
    setStep(0);
    setResult(null);
    onClose();
  }

  return (
    <div onClick={reset} className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div onClick={(e) => e.stopPropagation()} className="max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-gold/25 bg-navy-elevated p-8">
        <div className="mb-5 flex items-center justify-between">
          <div className="font-mono text-[11px] uppercase tracking-[.14em] text-gold">
            Passo {Math.min(step + 1, 5)} de 5 · {STEP_LABELS[step]}
          </div>
          <button onClick={reset} className="text-2xl text-text-muted" aria-label="Fechar">
            ×
          </button>
        </div>
        {step < 5 && (
          <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-gold to-gold-light transition-all" style={{ width: `${(step / 4) * 100}%` }} />
          </div>
        )}

        {step === 0 && (
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-bold text-white">Vamos descobrir o seu próximo passo.</h2>
            <p className="text-sm leading-relaxed text-text-tertiary">
              Duas perguntas rápidas e você vê, em 2 minutos: qual passo do Método 7M sua empresa deveria estar rodando, qual
              especialista conduz e o plano do seu porte. Sem cartão, sem compromisso.
            </p>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="mb-4 font-display text-xl font-bold text-white">Qual é o seu maior desafio hoje?</h2>
            <div className="flex flex-col gap-3">
              {CHALLENGES.map((c) => (
                <button key={c.id} onClick={() => setChallenge(c.id)} className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold ${challenge === c.id ? 'border-gold/60 bg-gold/15 text-gold-light' : 'border-white/10 bg-white/[.03] text-text-secondary'}`}>
                  <span className="text-lg">{c.icon}</span>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="mb-3 font-display text-lg font-bold text-white">Há quanto tempo sua empresa existe?</h2>
              <div className="grid grid-cols-2 gap-2">
                {AGES.map((a) => (
                  <button key={a} onClick={() => setCompanyAge(a)} className={chip(companyAge === a)}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h2 className="mb-3 font-display text-lg font-bold text-white">Faturamento aproximado?</h2>
              <div className="grid grid-cols-2 gap-2">
                {REVENUES.map((r) => (
                  <button key={r} onClick={() => setRevenueRange(r)} className={chip(revenueRange === r)}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold text-white">Seus dados para receber o resultado</h2>
            <div>
              <label className="text-sm font-semibold text-text-tertiary">Seu nome</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-white outline-none" placeholder="Como podemos te chamar" />
            </div>
            <div>
              <label className="text-sm font-semibold text-text-tertiary">Setor (opcional)</label>
              <input value={sector} onChange={(e) => setSector(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-white outline-none" placeholder="Ex.: Alimentação" />
            </div>
            <div>
              <label className="text-sm font-semibold text-text-tertiary">E-mail</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-white outline-none" placeholder="voce@empresa.com" />
            </div>
            <label className="flex items-start gap-2 text-xs leading-relaxed text-text-tertiary">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
              Concordo com o tratamento dos meus dados para receber o diagnóstico e contato da 7M Advisory, conforme a{' '}
              <a href="/privacidade" className="text-gold underline">
                Política de Privacidade
              </a>{' '}
              (LGPD).
            </label>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <h2 className="font-display text-xl font-bold text-white">Quer agendar uma conversa? (opcional)</h2>
            <div>
              <div className="mb-2 text-sm font-semibold text-text-tertiary">Dia</div>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((d) => (
                  <button key={d} onClick={() => setScheduledDay(d)} className={chip(scheduledDay === d)}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
            {scheduledDay && (
              <>
                <div>
                  <div className="mb-2 text-sm font-semibold text-text-tertiary">Horário</div>
                  <div className="flex flex-wrap gap-2">
                    {SLOTS.map((s) => (
                      <button key={s} onClick={() => setScheduledSlot(s)} className={chip(scheduledSlot === s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="mb-2 text-sm font-semibold text-text-tertiary">Formato</div>
                  <div className="flex flex-wrap gap-2">
                    {FORMATS.map((f) => (
                      <button key={f} onClick={() => setScheduledFormat(f)} className={chip(scheduledFormat === f)}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <p className="text-xs text-text-muted">Prefere pular? É só continuar — você recebe o resultado sem agendar nada.</p>
          </div>
        )}

        {step === 5 && result && (
          <div className="space-y-5">
            <h2 className="font-display text-2xl font-bold text-white">
              Seu próximo passo: <span className="text-gold-light">Passo {result.suggestedStep}</span>
            </h2>
            <div className="rounded-2xl border border-gold/25 bg-gradient-to-br from-[#1a1608] to-navy-elevated p-5">
              <div className="font-mono text-[11px] uppercase tracking-[.12em] text-gold">Especialista responsável</div>
              <div className="mt-1 font-display text-lg font-bold text-white">{result.suggestedSpecialist}</div>
              <div className="mt-3 font-mono text-[11px] uppercase tracking-[.12em] text-gold">Plano do seu porte</div>
              <div className="mt-1 font-display text-lg font-bold text-white">{result.suggestedPlan}</div>
            </div>
            <p className="text-sm text-text-tertiary">
              Enviamos os detalhes para <strong className="text-white">{email}</strong>. Crie sua conta para acompanhar sua
              esteira de 7 passos no dashboard.
            </p>
            <GoldButton onClick={() => router.push('/login?mode=signup')} className="w-full">
              Criar minha conta
            </GoldButton>
          </div>
        )}

        {error && <p className="mt-3 text-sm text-orange">{error}</p>}

        {step < 5 && (
          <div className="mt-7 flex items-center justify-between gap-3">
            {step > 0 ? <GhostButton onClick={() => setStep((s) => s - 1)}>← Voltar</GhostButton> : <span />}
            <GoldButton onClick={next} disabled={!canNext || submitting}>
              {submitting ? 'Enviando…' : step === 4 ? 'Ver meu resultado' : 'Continuar'}
            </GoldButton>
          </div>
        )}
      </div>
    </div>
  );
}
