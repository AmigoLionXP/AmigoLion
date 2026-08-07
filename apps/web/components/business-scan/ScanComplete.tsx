'use client';

import { Lang } from '@/lib/i18n';

export function ScanComplete({ lang, growthScore, onClose }: { lang: Lang; growthScore?: number; onClose: () => void }) {
  const items = [
    { pt: 'Método 7M', en: '7M Method' },
    { pt: 'Growth Score', en: 'Growth Score' },
    { pt: 'IA', en: 'AI' },
    { pt: 'Growth Manager', en: 'Growth Manager' },
    { pt: 'Dashboard', en: 'Dashboard' },
    { pt: 'Relatórios', en: 'Reports' },
  ];

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-10 text-center">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl"
        style={{ background: 'linear-gradient(140deg,#5ee08a,#8FB4FF)' }}
      >
        ✓
      </div>
      <div className="mt-5 font-display text-[24px] font-bold leading-[1.2] text-white">
        {lang === 'pt' ? 'Business Scan concluído.' : 'Business Scan completed.'}
      </div>
      <div className="mt-3 max-w-[320px] text-[14px] leading-[1.6] text-text-tertiary">
        {lang === 'pt'
          ? 'Sua empresa agora possui um DNA Digital na 7MARKET.'
          : 'Your company now has a Digital DNA at 7MARKET.'}
      </div>
      {typeof growthScore === 'number' && (
        <div className="mt-5 rounded-2xl border border-gold/25 bg-gold/[.08] px-6 py-4">
          <div className="font-mono text-[10px] uppercase tracking-[.14em] text-gold">Growth Score</div>
          <div className="mt-1 font-display text-3xl font-bold text-white">{growthScore}</div>
        </div>
      )}
      <div className="mt-6 text-[12px] text-text-secondary">
        {lang === 'pt' ? 'As informações alimentarão automaticamente:' : 'This information will automatically feed:'}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        {items.map((it) => (
          <span key={it.pt} className="rounded-full border border-ai-blue/25 bg-ai-blue/10 px-3 py-1.5 text-[11px] text-text-tertiary">
            {lang === 'pt' ? it.pt : it.en}
          </span>
        ))}
      </div>
      <button
        onClick={onClose}
        className="mt-8 w-full max-w-[320px] rounded-[13px] p-[16px] font-display text-[16px] font-bold text-navy"
        style={{ background: 'linear-gradient(140deg,#C99A2E,#F4D48A)' }}
      >
        {lang === 'pt' ? 'Ir para o app' : 'Go to the app'}
      </button>
    </div>
  );
}
