'use client';

import { Lang } from '@/lib/i18n';

export function ScanIntro({ lang, onStart, onClose }: { lang: Lang; onStart: () => void; onClose: () => void }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-10 text-center">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl"
        style={{ background: 'linear-gradient(140deg,#C99A2E,#F4D48A)' }}
      >
        🧬
      </div>
      <div className="mt-5 font-mono text-[11px] uppercase tracking-[.16em] text-gold">7MARKET BUSINESS SCAN™</div>
      <div className="mt-2 font-display text-[24px] font-bold leading-[1.2] text-white">
        {lang === 'pt' ? 'Vamos conhecer sua empresa' : "Let's get to know your company"}
      </div>
      <div className="mt-4 max-w-[320px] text-[14px] leading-[1.6] text-text-tertiary">
        {lang === 'pt'
          ? 'Antes de iniciar sua jornada na 7MARKET precisamos conhecer sua empresa. Quanto mais informações você fornecer, mais precisas serão as recomendações da IA e do seu Growth Manager.'
          : 'Before you start your journey at 7MARKET, we need to get to know your company. The more information you provide, the more precise your AI and Growth Manager recommendations will be.'}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] text-text-secondary">
        <span className="rounded-full border border-white/10 bg-white/[.05] px-3 py-1.5">
          {lang === 'pt' ? '8 etapas' : '8 steps'}
        </span>
        <span className="rounded-full border border-white/10 bg-white/[.05] px-3 py-1.5">
          {lang === 'pt' ? 'Salva automaticamente' : 'Autosaves'}
        </span>
        <span className="rounded-full border border-white/10 bg-white/[.05] px-3 py-1.5">
          {lang === 'pt' ? 'Continue quando quiser' : 'Continue anytime'}
        </span>
      </div>
      <button
        onClick={onStart}
        className="mt-8 w-full max-w-[320px] rounded-[13px] p-[16px] font-display text-[16px] font-bold text-navy"
        style={{ background: 'linear-gradient(140deg,#C99A2E,#F4D48A)' }}
      >
        {lang === 'pt' ? 'Iniciar Business Scan' : 'Start Business Scan'}
      </button>
      <button onClick={onClose} className="mt-4 font-mono text-[11px] text-text-secondary underline decoration-dotted">
        {lang === 'pt' ? 'Explorar o app primeiro' : 'Explore the app first'}
      </button>
    </div>
  );
}
