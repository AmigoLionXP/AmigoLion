'use client';

import { useApp } from '@/lib/app-context';
import { t } from '@/lib/i18n';
import { MOCK_HUB_SCREENS } from '@/lib/mock-data';
import { CloseIcon, OverlayHeader } from './OverlayHeader';

export function MoreHubOverlay() {
  const { lang, setMore, setScreen, tasks, businessScanSummary, setBusinessScanOpen } = useApp();
  const openTasks = tasks.filter((tk) => !tk.done).length;
  const scanPct = businessScanSummary?.progressPct ?? 0;
  const scanDone = businessScanSummary?.status === 'completed';

  return (
    <div
      className="animate-ovin absolute inset-0 z-[45] flex flex-col"
      style={{ background: 'radial-gradient(120% 70% at 80% -5%, #0d2a5e, #0B2149 52%, #08132C)' }}
    >
      <OverlayHeader onClose={() => setMore(false)} icon={<CloseIcon />} title={t('more', lang)} subtitle={t('moreSub', lang)} />
      <div className="appscroll min-h-0 flex-1 overflow-y-auto p-[18px_18px_40px]">
        <button
          onClick={() => {
            setBusinessScanOpen(true);
            setMore(false);
          }}
          className="mb-3 flex w-full items-center gap-3.5 rounded-[18px] border border-gold/30 p-4 text-left"
          style={{ background: 'linear-gradient(150deg,rgba(201,154,46,.14),rgba(11,33,73,.2))' }}
        >
          <div
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[13px] text-xl"
            style={{ background: 'linear-gradient(140deg,#C99A2E,#F4D48A)' }}
          >
            🧬
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-[15px] font-bold text-white">7MARKET Business Scan™</div>
            <div className="mt-0.5 text-[11.5px] text-text-secondary">
              {scanDone
                ? lang === 'pt'
                  ? 'DNA Digital completo'
                  : 'Digital DNA complete'
                : lang === 'pt'
                  ? `${scanPct}% do DNA Digital`
                  : `${scanPct}% of the Digital DNA`}
            </div>
          </div>
          {!scanDone && (
            <div className="flex-shrink-0 font-mono text-[13px] font-semibold text-gold-light">{scanPct}%</div>
          )}
        </button>

        <div className="grid grid-cols-2 gap-3">
          {MOCK_HUB_SCREENS.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setScreen(item.key);
                setMore(false);
              }}
              className="flex min-h-[104px] flex-col justify-between rounded-[18px] border border-white/[.08] bg-white/[.035] p-4 text-left"
            >
              <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-gold/[.16] text-[17px] text-gold-light">
                {item.icon}
              </div>
              <div>
                <div className="font-display text-[15px] font-bold text-white">{item.label[lang]}</div>
                <div className="mt-0.5 text-[11.5px] text-text-secondary">
                  {item.key === 'tarefas' ? `${openTasks} ${item.sub[lang]}` : item.sub[lang]}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
