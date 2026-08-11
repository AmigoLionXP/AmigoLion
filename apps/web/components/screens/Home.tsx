'use client';

import { useApp } from '@/lib/app-context';
import { t } from '@/lib/i18n';
import { companyView } from '@/lib/view-models';
import { NBA } from '@/lib/mock-data';
import { GrowthScoreRing } from '../GrowthScoreRing';

const STATUS_META = {
  done: { accent: '#F4D48A', chip: 'rgba(201,154,46,.16)' },
  doing: { accent: '#F4D48A', chip: 'rgba(201,154,46,.16)' },
  next: { accent: '#8FB4FF', chip: 'rgba(143,180,255,.18)' },
  locked: { accent: '#6b82a6', chip: 'rgba(255,255,255,.05)' },
} as const;

export function HomeScreen() {
  const { lang, company, steps, setOpenStep, setTab } = useApp();
  const view = companyView(company, lang);

  return (
    <div>
      {/* company header card */}
      <div className="flex items-center gap-[18px] rounded-card border border-gold/[.24] p-5" style={{ background: 'linear-gradient(150deg,rgba(201,154,46,.14),rgba(11,33,73,.2))' }}>
        <GrowthScoreRing score={view.growthScore} />
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[10px] uppercase tracking-[.14em] text-gold">{t('growthScore', lang)}</div>
          <div className="mt-[5px] font-display text-[17px] font-bold leading-[1.15] text-white">{view.band}</div>
          <div className="mt-[10px] flex flex-col gap-1.5">
            <div className="flex items-center gap-[7px] text-xs text-text-tertiary">
              <span className="h-[5px] w-[5px] rounded-full bg-ai-blue" />
              {view.meta}
            </div>
            <div className="flex items-center gap-[7px] text-xs text-text-tertiary">
              <span className="h-[5px] w-[5px] rounded-full bg-gold-light" />
              {view.revisao}
            </div>
          </div>
        </div>
      </div>

      {/* NEXT BEST ACTION */}
      <div className="relative mt-4 overflow-hidden rounded-card border border-gold/40" style={{ background: 'linear-gradient(155deg,#12336e,#0b1e42)' }}>
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(244,212,138,.22), transparent 70%)' }}
        />
        <div className="relative p-[22px]">
          <span
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[7px] px-[10px] py-[5px] font-mono text-[10px] font-bold uppercase tracking-[.14em] text-navy"
            style={{ background: 'linear-gradient(140deg,#C99A2E,#F4D48A)' }}
          >
            ★ {NBA.tag[lang]}
          </span>
          <div className="mt-[14px] text-balance font-display text-[22px] font-bold leading-[1.2] text-white">{NBA.title[lang]}</div>
          <div className="mt-3 text-[13.5px] leading-[1.55] text-text-tertiary">{NBA.why[lang]}</div>
          <div className="mt-[14px] flex items-start gap-2.5 rounded-[13px] border border-ai-blue/25 bg-ai-blue/10 p-[13px_14px]">
            <div className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-lg bg-ai-blue/[.18] text-sm">✦</div>
            <div className="text-[12.5px] leading-[1.5] text-[#cdd9ef]">
              <span className="font-bold text-ai-blue">7M AI · </span>
              {NBA.rec[lang]}
            </div>
          </div>
          <button
            onClick={() => setOpenStep(NBA.targetStepN)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-[13px] p-[15px] font-display text-[16px] font-bold text-navy"
            style={{ background: 'linear-gradient(140deg,#C99A2E,#F4D48A)' }}
          >
            {NBA.cta[lang]} →
          </button>
        </div>
      </div>

      {/* METODO 7M trail */}
      <div className="mt-[22px] flex items-center justify-between">
        <div className="font-display text-[16px] font-bold text-white">{t('myEvolution', lang)}</div>
        <button onClick={() => setTab('metodo')} className="font-mono text-[11px] text-text-secondary">
          {t('seeAll', lang)} →
        </button>
      </div>
      <div className="mt-3 flex flex-col gap-[9px]">
        {steps.map((s) => {
          const meta = STATUS_META[s.status];
          return (
            <button
              key={s.n}
              onClick={() => setOpenStep(s.n)}
              className="flex w-full items-center gap-[14px] rounded-[14px] border border-white/[.07] bg-white/[.03] p-[13px_15px] text-left"
              style={{ borderLeft: `3px solid ${meta.accent}` }}
            >
              <div
                className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[10px] font-display text-[12px] font-bold"
                style={{ background: meta.chip, color: meta.accent }}
              >
                {s.code}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-[14.5px] font-bold text-white">{lang === 'pt' ? s.verbPt : s.verbEn}</div>
                <div className="mt-px text-[11.5px] text-text-secondary">
                  {(lang === 'pt' ? s.deadlinePt : s.deadlineEn) ?? ''} · {lang === 'pt' ? s.specialistRolePt : s.specialistRoleEn}
                </div>
              </div>
              <div className="flex-shrink-0 text-right font-mono text-[14px] font-semibold" style={{ color: meta.accent }}>
                {s.pct}%
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
