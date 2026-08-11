'use client';

import { useApp } from '@/lib/app-context';
import { t, L } from '@/lib/i18n';
import { STEP_OBJECTIVES } from '@/lib/mock-data';
import { BackIcon, OverlayHeader } from './OverlayHeader';

const STATUS_META = {
  done: { accent: '#F4D48A', labelPt: 'Concluído', labelEn: 'Done' },
  doing: { accent: '#F4D48A', labelPt: 'Em andamento', labelEn: 'In progress' },
  next: { accent: '#8FB4FF', labelPt: 'Próximo passo', labelEn: 'Next step' },
  locked: { accent: '#6b82a6', labelPt: 'Bloqueado', labelEn: 'Locked' },
} as const;

export function StepDetailOverlay() {
  const { lang, steps, openStep, setOpenStep, toggleChecklistItem } = useApp();
  const step = steps.find((s) => s.n === openStep);
  if (!step) return null;

  const meta = STATUS_META[step.status];
  const objective = STEP_OBJECTIVES[step.n]?.[lang] ?? '';
  const ctaLabel =
    step.status === 'next'
      ? L('Iniciar esta etapa', 'Start this step', lang)
      : step.status === 'done'
        ? L('Ver relatório', 'View report', lang)
        : L('Voltar', 'Back', lang);

  const resources = [
    { icon: '📄', label: L('Templates e planilhas', 'Templates & spreadsheets', lang) },
    { icon: '▶', label: L('Vídeos do método', 'Method videos', lang) },
    { icon: '✦', label: L('Assistente 7M AI desta etapa', '7M AI assistant for this step', lang) },
  ];

  return (
    <div
      className="animate-ovin absolute inset-0 z-40 flex flex-col"
      style={{ background: 'radial-gradient(120% 70% at 80% -5%, #0d2a5e, #0B2149 52%, #08132C)' }}
    >
      <OverlayHeader
        onClose={() => setOpenStep(null)}
        icon={<BackIcon />}
        kicker={`${step.code} · ${lang === 'pt' ? meta.labelPt : meta.labelEn}`}
        title={lang === 'pt' ? step.verbPt : step.verbEn}
      />
      <div className="appscroll min-h-0 flex-1 overflow-y-auto p-[18px_18px_40px]">
        <div className="text-sm leading-[1.6] text-text-tertiary">{objective}</div>

        <div className="mt-[18px] flex items-center gap-[13px] rounded-2xl border border-gold/[.24] bg-gold/[.08] p-3.5">
          <div className="h-12 w-12 flex-shrink-0 rounded-xl bg-white/10" />
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[10px] uppercase tracking-[.1em] text-gold">{t('specialist', lang)}</div>
            <div className="mt-0.5 font-display text-[15px] font-bold text-white">{step.specialistName ?? '—'}</div>
            <div className="text-xs text-text-secondary">{lang === 'pt' ? step.specialistRolePt : step.specialistRoleEn}</div>
          </div>
          <button className="flex-shrink-0 rounded-[10px] border border-white/[.12] bg-white/[.07] px-3 py-[9px] text-xs font-semibold text-text">
            {t('talk', lang)}
          </button>
        </div>

        <div className="mt-3.5 grid grid-cols-2 gap-2.5">
          <div className="rounded-[14px] border border-white/[.08] bg-white/[.035] p-[13px_15px]">
            <div className="text-[11px] text-text-secondary">{t('progress', lang)}</div>
            <div className="mt-[3px] font-display text-[19px] font-bold" style={{ color: meta.accent }}>
              {step.pct}%
            </div>
          </div>
          <div className="rounded-[14px] border border-white/[.08] bg-white/[.035] p-[13px_15px]">
            <div className="text-[11px] text-text-secondary">{t('deadline', lang)}</div>
            <div className="mt-[3px] font-display text-[19px] font-bold text-white">
              {(lang === 'pt' ? step.deadlinePt : step.deadlineEn) ?? '—'}
            </div>
          </div>
        </div>

        <div className="mt-5 font-display text-[15px] font-bold text-white">{t('checklist', lang)}</div>
        <div className="mt-[11px] flex flex-col gap-2">
          {step.checklist.map((ck, i) => (
            <button
              key={i}
              onClick={() => toggleChecklistItem(step.n, i)}
              disabled={step.status === 'locked'}
              className="flex w-full items-center gap-3 rounded-xl border border-white/[.07] bg-white/[.03] p-[12px_14px] text-left disabled:cursor-not-allowed"
            >
              <div
                className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-[7px] text-xs text-navy"
                style={{
                  background: ck.done ? '#F4D48A' : 'transparent',
                  border: `1.5px solid ${ck.done ? '#F4D48A' : 'rgba(255,255,255,.2)'}`,
                }}
              >
                {ck.done ? '✓' : ''}
              </div>
              <div className="flex-1 text-[13.5px]" style={{ color: ck.done ? '#8ea0bc' : '#e8eef7' }}>
                {lang === 'pt' ? ck.txtPt : ck.txtEn}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-5 font-display text-[15px] font-bold text-white">{t('resources', lang)}</div>
        <div className="mt-[11px] flex flex-col gap-2">
          {resources.map((r, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-white/[.07] bg-white/[.03] p-[12px_14px]">
              <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[9px] bg-ai-blue/[.14] text-sm">
                {r.icon}
              </div>
              <div className="flex-1 text-[13.5px] text-text">{r.label}</div>
              <svg width="7" height="12" viewBox="0 0 8 14" className="flex-shrink-0">
                <path d="M1 1l6 6-6 6" stroke="rgba(255,255,255,.3)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ))}
        </div>

        <button
          onClick={() => setOpenStep(null)}
          className="mt-6 w-full rounded-[13px] p-[15px] font-display text-[15px] font-bold text-navy"
          style={{ background: 'linear-gradient(140deg,#C99A2E,#F4D48A)' }}
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}
