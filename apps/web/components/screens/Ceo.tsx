'use client';

import { useApp } from '@/lib/app-context';
import { t } from '@/lib/i18n';
import { MOCK_CEO } from '@/lib/mock-data';

export function CeoScreen() {
  const { lang } = useApp();

  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-[.16em] text-gold">{t('ceoKick', lang)}</div>
      <div className="mt-1.5 font-display text-2xl font-bold tracking-[-.02em] text-white">{t('ceoTitle', lang)}</div>
      <div className="mt-[5px] text-[12.5px] leading-[1.4] text-text-secondary">{t('ceoSub', lang)}</div>

      <div className="mt-[18px] flex flex-col gap-[11px]">
        {MOCK_CEO.map((k) => (
          <div key={k.n} className="flex items-center gap-4 rounded-2xl border border-white/[.08] bg-white/[.035] p-[16px_18px]">
            <div className="w-4 flex-shrink-0 font-mono text-[11px] text-muted">{k.n}</div>
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] text-text-secondary">{k.label[lang]}</div>
              <div className="mt-0.5 font-display text-[22px] font-bold leading-none text-white">
                {typeof k.value === 'string' ? k.value : k.value[lang]}
              </div>
            </div>
            <div
              className="flex flex-shrink-0 items-center gap-[7px] rounded-[9px] px-[11px] py-1.5 text-xs font-semibold"
              style={{ color: k.tagColor, background: k.tagBg }}
            >
              {k.tag[lang]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
