'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Wizard } from '@/components/Wizard';
import { FloatingActions } from '@/components/FloatingActions';
import { GoldButton, GhostButton, Card, Kicker } from '@/components/ui/Primitives';
import { PLAN_LADDER } from '@/lib/plans';

const CHALLENGES = [
  { id: 'growth', label: 'Vender mais e atrair clientes', icon: '📈', step: 'Passo 4 — Crescer', plan: '7M3', spec: 'Growth & Marketing Specialist' },
  { id: 'finance', label: 'Organizar finanças e caixa', icon: '📊', step: 'Passo 3 — Organizar', plan: '7M2', spec: 'Financial Advisor' },
  { id: 'owner', label: 'Sair da operação', icon: '🧭', step: 'Passo 2 — Qualificar', plan: '7M2', spec: 'Business Strategist' },
  { id: 'capital', label: 'Acessar capital e crédito', icon: '💰', step: 'Passo 5 — Capitalizar', plan: '7M4', spec: 'Financial Advisor' },
  { id: 'scale', label: 'Escalar e abrir novas unidades', icon: '🚀', step: 'Passo 6 — Escalar', plan: '7M5', spec: 'Operations & Scale Specialist' },
  { id: 'legacy', label: 'Valorizar ou vender a empresa', icon: '🏆', step: 'Passo 7 — Valorizar', plan: '7M6', spec: 'Wealth & Legacy Advisor' },
] as const;

const STEPS = [
  { n: '1', verb: 'Diagnosticar', phase: 'Estruturar', accent: '#8FB4FF', desc: 'Raio-x do negócio: público-alvo, capital de giro, precificação e concorrência. Entrega um plano estratégico de 12 meses.', owner: 'Administrador de Empresas' },
  { n: '2', verb: 'Qualificar', phase: 'Estruturar', accent: '#8FB4FF', desc: 'Capacitação do dono e da equipe em gestão e processos — para o negócio rodar sem depender 60h/semana do fundador.', owner: 'Administrador de Empresas' },
  { n: '3', verb: 'Organizar', phase: 'Estruturar', accent: '#8FB4FF', desc: 'Fluxo de caixa, formalização e balanços organizados. Pré-requisito para acesso a crédito com credibilidade.', owner: 'Contador' },
  { n: '4', verb: 'Crescer', phase: 'Crescer', accent: '#E7C871', desc: 'Marketing digital completo: posicionamento, tráfego pago, redes sociais e funil de vendas. O motor da receita.', owner: 'Growth & Marketing Specialist' },
  { n: '5', verb: 'Capitalizar', phase: 'Crescer', accent: '#E7C871', desc: 'Com a casa organizada, estruturamos o acesso a crédito e capital nas melhores condições e o uso planejado.', owner: 'Financial Advisor' },
  { n: '6', verb: 'Escalar', phase: 'Escalar', accent: '#E9611A', desc: 'Escala e expansão: padronização, filiais, franquia e novos canais. Um negócio que se replica.', owner: 'Operations & Scale Specialist' },
  { n: '7', verb: 'Valorizar', phase: 'Topo', accent: '#E9611A', desc: 'Valuation e patrimônio: a empresa vira ativo que se vende, atrai sócio e capta investimento. Governança e saída.', owner: 'Especialista em Investimentos' },
];

const PAINS = [
  { stat: '60%', text: 'das micro e pequenas empresas brasileiras fecham em até 5 anos (fonte: Sebrae).' },
  { stat: '78%', text: 'dos donos trabalham mais de 50h/semana — o gargalo costuma ser o próprio dono.' },
  { stat: '45%', text: 'têm dificuldade de acessar crédito nas melhores condições.' },
  { stat: '#1', text: 'causa de mortalidade: falha de gestão e planejamento.' },
];

const TEAM = [
  { i: 'A', role: 'Administrador de Empresas', agent: '+ agente de gestão & processos', step: 'Passo 1–2' },
  { i: 'C', role: 'Contador', agent: '+ agente fiscal & fluxo de caixa', step: 'Passo 3' },
  { i: 'M', role: 'Gestor de Marketing Digital', agent: '+ agente de tráfego & funil', step: 'Passo 4' },
  { i: 'K', role: 'Gestor de Capital', agent: '+ agente de crédito & escala', step: 'Passo 5–6' },
  { i: 'I', role: 'Especialista em Investimentos', agent: '+ agente de valuation', step: 'Passo 7' },
];

const FAQS = [
  { q: 'Quem é a 7M Advisory?', a: 'Somos uma equipe de consultores especializados no mercado de varejo e em empreendedores. Desenvolvemos o Método 7M para levar empresas do diagnóstico ao patrimônio, unindo especialistas humanos e agentes de IA.' },
  { q: 'O que é o Método 7M?', a: 'Um sistema de crescimento que combina especialistas humanos e inteligência artificial. Cada empresa entra num ponto diferente da jornada — o diagnóstico gratuito mostra o seu e revela quais passos se aplicam a você.' },
  { q: 'Como eu começo?', a: 'Pelo diagnóstico gratuito: em 2 minutos você descobre seu próximo passo e conversa com um especialista. A partir daí, o método se revela para o seu caso, sem compromisso.' },
  { q: 'Preciso ter empresa estruturada para começar?', a: 'Não. Começamos de onde você está — do MEI que ainda organiza o caixa à empresa que quer virar patrimônio.' },
  { q: 'A IA substitui o especialista humano?', a: 'Não. Os agentes de IA coletam, analisam e recomendam; o especialista humano valida e decide. Você tem os dois.' },
  { q: 'Onde vocês atuam?', a: 'Do Brasil à Europa, com foco em varejo e em pequenos, médios e grandes empreendedores. O diagnóstico é o primeiro passo para descobrir onde seu negócio trava.' },
];

export default function Landing() {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [heroChallenge, setHeroChallenge] = useState<string>('');
  const [methodOpen, setMethodOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const heroPreview = CHALLENGES.find((c) => c.id === heroChallenge);

  return (
    <div className="min-h-screen bg-navy">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/[.06] bg-navy/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo />
          <nav className="hidden gap-8 font-semibold text-sm text-text-tertiary md:flex">
            <a href="#metodo" className="hover:text-white">Método</a>
            <a href="#arquitetura" className="hover:text-white">Planos</a>
            <a href="#faq" className="hover:text-white">Dúvidas</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden text-sm font-semibold text-text-tertiary hover:text-white sm:block">
              Entrar
            </Link>
            <GoldButton onClick={() => setWizardOpen(true)} className="px-5 py-2.5 text-sm">
              Ver meu próximo passo
            </GoldButton>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 md:pt-24">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <Kicker>SEVEN STEPS TO THE TOP</Kicker>
            <h1 className="mt-4 font-display text-4xl font-bold leading-[1.05] tracking-tight text-white md:text-5xl">
              Do diagnóstico ao{' '}
              <span className="font-serif italic font-normal text-gold-light">patrimônio</span>.
            </h1>
            <p className="mt-5 max-w-md text-lg text-text-tertiary">
              A infraestrutura de crescimento para o empreendedor brasileiro: especialistas humanos + agentes de IA, 7 passos,
              um plano do seu porte.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <GoldButton onClick={() => setWizardOpen(true)}>Ver meu próximo passo — grátis</GoldButton>
              <Link href="/login">
                <GhostButton>Acessar plataforma</GhostButton>
              </Link>
            </div>
            <div className="mt-5 flex flex-wrap gap-5 font-mono text-xs text-text-muted">
              <span>✓ Sem cartão</span>
              <span>✓ Sem compromisso</span>
              <span>✓ Resultado em 2 minutos</span>
            </div>
          </div>

          <div>
            <div className="mb-3 text-sm font-semibold text-text-tertiary">Qual é o seu maior desafio agora?</div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {CHALLENGES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setHeroChallenge(c.id)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                    heroChallenge === c.id ? 'border-gold/60 bg-gold/15 text-gold-light' : 'border-white/10 bg-white/[.03] text-text-tertiary hover:border-white/20'
                  }`}
                >
                  <span>{c.icon}</span>
                  {c.label}
                </button>
              ))}
            </div>
            {heroPreview && (
              <Card className="mt-4 border-gold/25 bg-gradient-to-br from-[#1a1608] to-navy-elevated">
                <Kicker>Seu próximo passo, em teoria</Kicker>
                <div className="mt-1 font-display text-lg font-bold text-white">{heroPreview.step}</div>
                <div className="mt-1 text-sm text-text-tertiary">
                  Conduzido por <strong className="text-white">{heroPreview.spec}</strong> · plano sugerido{' '}
                  <strong className="text-gold-light">{heroPreview.plan}</strong>
                </div>
                <p className="mt-2 text-xs text-text-muted">Faça o diagnóstico completo para confirmar — leva 2 minutos.</p>
                <GoldButton onClick={() => setWizardOpen(true)} className="mt-4 w-full">
                  Confirmar meu diagnóstico
                </GoldButton>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Pains */}
      <section className="border-y border-white/[.06] bg-navy-elevated/50">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-14 md:grid-cols-4">
          {PAINS.map((p) => (
            <div key={p.text}>
              <div className="font-display text-3xl font-bold text-gold-light md:text-4xl">{p.stat}</div>
              <div className="mt-2 text-sm text-text-tertiary">{p.text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Método 7M */}
      <section id="metodo" className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center">
          <Kicker>O MÉTODO</Kicker>
          <h2 className="mt-3 font-display text-3xl font-bold text-white md:text-4xl">7 passos. Do diagnóstico ao patrimônio.</h2>
          <p className="mx-auto mt-3 max-w-xl text-text-tertiary">
            Cada passo é conduzido por um especialista humano + um agente de IA. Você avança no ritmo da sua empresa.
          </p>
        </div>

        {!methodOpen ? (
          <div className="mt-10 rounded-2xl border border-gold/20 bg-gradient-to-b from-white/[.03] to-transparent p-10 text-center">
            <div className="mb-6 flex flex-col items-center gap-3">
              {STEPS.map((s, idx) => (
                <div key={s.n} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.04] px-5 py-3 opacity-70 blur-[1px]" style={{ width: `${52 + idx * 7}%`, borderLeft: `4px solid ${s.accent}` }}>
                  <span className="font-serif text-2xl italic" style={{ color: s.accent }}>{s.n}</span>
                  <span className="font-semibold text-white">{s.verb}</span>
                </div>
              ))}
            </div>
            <p className="text-text-tertiary">O método se revela com o seu diagnóstico gratuito.</p>
            <GoldButton onClick={() => setWizardOpen(true)} className="mt-4">
              Fazer diagnóstico e desbloquear
            </GoldButton>
            <button onClick={() => setMethodOpen(true)} className="mt-3 block w-full text-sm text-text-muted underline">
              já conheço, mostrar mesmo assim
            </button>
          </div>
        ) : (
          <div className="mt-10 flex flex-col gap-3">
            {STEPS.map((s) => (
              <div key={s.n} className="flex flex-col gap-3 rounded-2xl border border-white/[.08] bg-white/[.02] p-5 md:flex-row md:items-center md:gap-6" style={{ borderLeft: `5px solid ${s.accent}` }}>
                <div className="font-serif text-4xl italic" style={{ color: s.accent }}>{s.n}</div>
                <div className="md:w-36">
                  <div className="font-display text-lg font-bold text-white">{s.verb}</div>
                  <div className="font-mono text-[11px] uppercase tracking-wide" style={{ color: s.accent }}>{s.phase}</div>
                </div>
                <div className="flex-1 text-sm text-text-secondary">{s.desc}</div>
                <div className="font-mono text-xs text-text-muted md:text-right md:w-40">{s.owner}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Equipe */}
      <section className="border-t border-white/[.06] bg-navy-elevated/40">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center">
            <Kicker>QUEM CONDUZ</Kicker>
            <h2 className="mt-3 font-display text-3xl font-bold text-white">Especialista humano + agente de IA, em cada passo</h2>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {TEAM.map((t) => (
              <Card key={t.role} className="text-center">
                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-white/10 to-white/5 font-display text-lg font-bold text-gold-light">
                  {t.i}
                </div>
                <div className="font-display text-sm font-bold text-white">{t.role}</div>
                <div className="mt-1 text-xs text-gold">{t.agent}</div>
                <div className="mt-2 font-mono text-[10px] text-text-muted">{t.step}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Arquitetura / planos */}
      <section id="arquitetura" className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center">
          <Kicker>ARQUITETURA</Kicker>
          <h2 className="mt-3 font-display text-3xl font-bold text-white">Um plano para cada porte</h2>
          <p className="mx-auto mt-3 max-w-xl text-text-tertiary">
            Comece pelo diagnóstico gratuito. A entrada no método é o plano 7M0, {PLAN_LADDER[0].priceLabel} — os níveis seguintes
            acompanham o crescimento da sua rede.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <Card>
            <div className="text-lg font-bold text-white">Empreendedor individual</div>
            <div className="mt-2 text-sm text-text-tertiary">Uma empresa entra no método e roda os 7 passos com seu especialista + agente de IA.</div>
          </Card>
          <Card>
            <div className="text-lg font-bold text-white">Rede local</div>
            <div className="mt-2 text-sm text-text-tertiary">Grupos e capítulos de empresas que trocam indicações, permutas e negócios via Marketplace.</div>
          </Card>
          <Card>
            <div className="text-lg font-bold text-white">Expansão regional/nacional</div>
            <div className="mt-2 text-sm text-text-tertiary">Hubs estaduais e rede nacional, para quem lidera a expansão do método em sua praça.</div>
          </Card>
        </div>
        <div className="mt-8 rounded-2xl border border-white/[.08] bg-white/[.02] p-8 text-center">
          <p className="text-text-tertiary">
            Os 8 níveis (7M0–7M7), preços e comissões de rede são apresentados por um especialista, junto com o diagnóstico da
            sua empresa.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <GoldButton onClick={() => setWizardOpen(true)}>Ver meu plano — grátis</GoldButton>
            <a href="https://wa.me/41779578583" target="_blank" rel="noreferrer">
              <GhostButton>Falar com especialista</GhostButton>
            </a>
          </div>
        </div>
      </section>

      {/* Casos de aplicação — ilustrativo, sem clientes/números reais (ver PROMPT_FRONTEND.md restrição 1) */}
      <section className="border-t border-white/[.06] bg-navy-elevated/40">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center">
            <Kicker>EXEMPLOS DE APLICAÇÃO · ILUSTRATIVO</Kicker>
            <h2 className="mt-3 font-display text-3xl font-bold text-white">Como o método se aplica ao seu desafio</h2>
            <p className="mx-auto mt-3 max-w-xl text-text-tertiary">
              Cada desafio aponta para um passo diferente da jornada — o seu diagnóstico é o que confirma o seu caso.
            </p>
          </div>
          {/* TODO: substituir por casos reais de clientes 7M Advisory antes de divulgar como prova social. */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {CHALLENGES.map((c) => (
              <Card key={c.id}>
                <div className="text-2xl">{c.icon}</div>
                <div className="mt-2 font-display text-base font-bold text-white">{c.label}</div>
                <div className="mt-2 text-sm text-text-tertiary">
                  → {c.step} · conduzido por <strong className="text-white">{c.spec}</strong>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-6 py-20">
        <h2 className="text-center font-display text-3xl font-bold text-white md:text-4xl">Dúvidas frequentes</h2>
        <div className="mt-10 flex flex-col gap-3">
          {FAQS.map((f, i) => (
            <div key={f.q} onClick={() => setFaqOpen(faqOpen === i ? null : i)} className="cursor-pointer rounded-2xl border border-white/[.07] bg-white/[.03] px-6 py-5">
              <div className="flex items-center justify-between gap-4">
                <div className="font-display font-bold text-white">{f.q}</div>
                <div className="flex-shrink-0 text-xl text-gold">{faqOpen === i ? '−' : '+'}</div>
              </div>
              {faqOpen === i && <div className="mt-3 text-sm leading-relaxed text-text-tertiary">{f.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/[.06] bg-[radial-gradient(120%_100%_at_50%_0%,#17140c_0%,#0a1436_60%)]">
        <div className="mx-auto max-w-2xl px-6 py-24 text-center">
          <h2 className="text-balance font-display text-4xl font-bold text-white md:text-5xl">
            Comece no passo 1 hoje. <span className="font-serif italic font-normal text-gold-light">Chegue ao topo.</span>
          </h2>
          <p className="mt-5 text-lg text-text-tertiary">
            Cadastre sua empresa e veja seu próximo passo dentro do Método 7M — quem conduz e o plano do seu porte.
          </p>
          <GoldButton onClick={() => setWizardOpen(true)} className="mt-8 px-11 py-4 text-lg">
            Ver meu próximo passo — grátis
          </GoldButton>
          <div className="mt-5 flex flex-wrap justify-center gap-6 font-mono text-xs text-text-muted">
            <span>✓ Sem cartão</span>
            <span>✓ Sem compromisso</span>
            <span>✓ Resultado em 2 minutos</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[.06] bg-navy-elevated">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 px-6 py-10">
          <Logo />
          <div className="font-mono text-xs text-text-dim">SEVEN STEPS TO THE TOP · © 2026 7M Advisory</div>
        </div>
      </footer>

      <Wizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
      <FloatingActions />
    </div>
  );
}
