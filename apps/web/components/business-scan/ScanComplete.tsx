'use client';

import { useEffect, useState } from 'react';
import { Lang } from '@/lib/i18n';
import { api, CopilotExecutiveSummaryDto } from '@/lib/api';
import { useApp } from '@/lib/app-context';

export function ScanComplete({ lang, growthScore, onClose }: { lang: Lang; growthScore?: number; onClose: () => void }) {
  const { setTab } = useApp();
  const [summary, setSummary] = useState<CopilotExecutiveSummaryDto | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getCopilotExecutiveSummary(lang)
      .then((s) => {
        if (!cancelled) setSummary(s);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const score = growthScore ?? summary?.growthScore;

  function startMethod() {
    onClose();
    setTab('metodo');
  }

  const items = [
    { pt: 'Método 7M', en: '7M Method' },
    { pt: 'Growth Score', en: 'Growth Score' },
    { pt: 'IA', en: 'AI' },
    { pt: 'Growth Manager', en: 'Growth Manager' },
    { pt: 'Dashboard', en: 'Dashboard' },
    { pt: 'Relatórios', en: 'Reports' },
  ];

  return (
    <div className="appscroll flex min-h-full flex-col items-center overflow-y-auto px-6 py-10 text-center">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl"
        style={{ background: 'linear-gradient(140deg,#5ee08a,#8FB4FF)' }}
      >
        ✓
      </div>
      <div className="mt-5 font-display text-[24px] font-bold leading-[1.2] text-white">
        {lang === 'pt' ? 'Parabéns! O DNA Digital da sua empresa foi criado.' : 'Congratulations! Your company\'s Digital DNA was created.'}
      </div>
      <div className="mt-3 max-w-[320px] text-[14px] leading-[1.6] text-text-tertiary">
        {lang === 'pt'
          ? 'Com base nas informações coletadas, o 7M Copilot™.AI identificou:'
          : 'Based on the information collected, 7M Copilot™.AI identified:'}
      </div>

      {summary && (
        <div className="mt-5 grid w-full max-w-[340px] grid-cols-3 gap-2">
          <div className="rounded-xl border border-white/10 bg-white/[.04] px-2 py-3">
            <div className="font-display text-xl font-bold text-[#5ee08a]">{summary.strengthsCount}</div>
            <div className="mt-0.5 text-[10px] text-text-secondary">{lang === 'pt' ? 'Pontos fortes' : 'Strengths'}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[.04] px-2 py-3">
            <div className="font-display text-xl font-bold text-[#8FB4FF]">{summary.opportunitiesCount}</div>
            <div className="mt-0.5 text-[10px] text-text-secondary">{lang === 'pt' ? 'Oportunidades' : 'Opportunities'}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[.04] px-2 py-3">
            <div className="font-display text-xl font-bold text-[#e0985e]">{summary.risksCount}</div>
            <div className="mt-0.5 text-[10px] text-text-secondary">{lang === 'pt' ? 'Riscos prioritários' : 'Priority risks'}</div>
          </div>
        </div>
      )}

      {typeof score === 'number' && (
        <div className="mt-5 rounded-2xl border border-gold/25 bg-gold/[.08] px-6 py-4">
          <div className="font-mono text-[10px] uppercase tracking-[.14em] text-gold">
            {lang === 'pt' ? 'Growth Score inicial' : 'Initial Growth Score'}
          </div>
          <div className="mt-1 font-display text-3xl font-bold text-white">{score}</div>
        </div>
      )}

      {summary && (
        <div className="mt-4 max-w-[340px] rounded-xl border border-white/10 bg-white/[.03] px-4 py-3 text-left text-[12.5px] leading-[1.5] text-text-tertiary">
          {summary.priority}
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
        onClick={startMethod}
        className="mt-8 w-full max-w-[320px] rounded-[13px] p-[16px] font-display text-[16px] font-bold text-navy"
        style={{ background: 'linear-gradient(140deg,#C99A2E,#F4D48A)' }}
      >
        {lang === 'pt' ? 'Iniciar o Método 7M' : 'Start the 7M Method'}
      </button>
      <button onClick={onClose} className="mt-3 w-full max-w-[320px] rounded-[13px] p-[14px] text-[13px] font-semibold text-text-secondary">
        {lang === 'pt' ? 'Ir para o app' : 'Go to the app'}
      </button>
    </div>
  );
}
