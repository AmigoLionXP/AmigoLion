'use client';

import { useApp } from '@/lib/app-context';
import { t } from '@/lib/i18n';
import { MOCK_CARDS } from '@/lib/mock-data';

export function PainelScreen() {
  const { lang } = useApp();

  return (
    <div>
      <div className="font-display text-2xl font-bold tracking-[-.02em] text-white">{t('dashboard', lang)}</div>
      <div className="mt-1 text-[13px] text-text-secondary">{t('dashboardSub', lang)}</div>
      <div className="mt-[18px] grid grid-cols-2 gap-3 desktop:grid-cols-3">
        {MOCK_CARDS.map((c, i) => (
          <div key={i} className="flex min-h-[132px] flex-col justify-between rounded-[18px] border border-white/[.08] bg-white/[.035] p-4">
            <div className="flex items-center justify-between">
              <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] text-[15px]" style={{ background: c.iconBg }}>
                {c.icon}
              </div>
              {c.delta && (
                <span className="font-mono text-[11px] font-semibold" style={{ color: c.deltaColor }}>
                  {c.delta[lang]}
                </span>
              )}
            </div>
            <div>
              <div className="font-display text-2xl font-bold leading-none text-white">
                {typeof c.value === 'string' ? c.value : c.value[lang]}
              </div>
              <div className="mt-[5px] text-[11.5px] leading-[1.3] text-text-secondary">{c.label[lang]}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
