'use client';

import { useApp } from '@/lib/app-context';
import { t, L } from '@/lib/i18n';

const STATUS_META = {
  done: { accent: '#F4D48A', chip: 'rgba(201,154,46,.16)', icon: '✓', labelPt: 'Concluído', labelEn: 'Done' },
  doing: { accent: '#F4D48A', chip: 'rgba(201,154,46,.16)', icon: '◐', labelPt: 'Em andamento', labelEn: 'In progress' },
  next: { accent: '#8FB4FF', chip: 'rgba(143,180,255,.18)', icon: '▶', labelPt: 'Próximo passo', labelEn: 'Next step' },
  locked: { accent: '#6b82a6', chip: 'rgba(255,255,255,.05)', icon: '🔒', labelPt: 'Bloqueado', labelEn: 'Locked' },
} as const;

export function MetodoScreen() {
  const { lang, steps, stepsGated, setOpenStep } = useApp();

  const doneCount = steps.filter((s) => s.status === 'done').length;
  const overallPct = steps.length ? Math.round(steps.reduce((a, s) => a + s.pct, 0) / steps.length) : 0;

  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-[.16em] text-gold">{t('method', lang)}</div>
      <div className="mt-1.5 font-display text-2xl font-bold tracking-[-.02em] text-white">{t('methodTitle', lang)}</div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[.07]">
        <div className="h-full rounded-full" style={{ width: `${overallPct}%`, background: 'linear-gradient(90deg,#C99A2E,#F4D48A)' }} />
      </div>
      <div className="mt-[7px] font-mono text-[11px] text-text-secondary">
        {L(`${doneCount} de 7 etapas concluídas · ${overallPct}% do método`, `${doneCount} of 7 steps done · ${overallPct}% of the method`, lang)}
      </div>

      {stepsGated && (
        <div className="mt-4 rounded-[14px] border border-gold/25 bg-gold/[.08] p-4 text-[13px] leading-[1.5] text-text-tertiary">
          {L(
            'Conclua o diagnóstico para liberar o detalhe de cada etapa do Método 7M.',
            'Finish the diagnostic to unlock the detail of each 7M Method step.',
            lang,
          )}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-[11px]">
        {steps.map((s) => {
          const meta = STATUS_META[s.status];
          const isNext = s.status === 'next';
          return (
            <button
              key={s.n}
              onClick={() => setOpenStep(s.n)}
              className="flex w-full items-center gap-[14px] rounded-2xl border p-[15px] text-left"
              style={{
                background: isNext ? 'rgba(143,180,255,.07)' : 'rgba(255,255,255,.03)',
                borderColor: isNext ? 'rgba(143,180,255,.35)' : 'rgba(255,255,255,.07)',
              }}
            >
              <div
                className="flex h-11 w-11 flex-shrink-0 flex-col items-center justify-center rounded-[13px]"
                style={{ background: meta.chip, color: meta.accent }}
              >
                <span className="font-mono text-[8px] tracking-[.06em]">{s.code}</span>
                <span className="text-[15px]">{meta.icon}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-[16px] font-bold text-white">{lang === 'pt' ? s.verbPt : s.verbEn}</div>
                <div className="mt-0.5 text-xs leading-[1.35] text-text-secondary">
                  {lang === 'pt' ? s.specialistRolePt : s.specialistRoleEn}
                </div>
                <div className="mt-[9px] h-1 overflow-hidden rounded-full bg-white/[.07]">
                  <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: meta.accent }} />
                </div>
              </div>
              <svg width="8" height="14" viewBox="0 0 8 14" className="flex-shrink-0">
                <path d="M1 1l6 6-6 6" stroke="rgba(255,255,255,.3)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          );
        })}
      </div>
    </div>
  );
}
