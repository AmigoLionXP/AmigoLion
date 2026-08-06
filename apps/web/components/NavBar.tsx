'use client';

import { Tab, useApp } from '@/lib/app-context';
import { t } from '@/lib/i18n';

const ICONS: Record<Tab, JSX.Element> = {
  home: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d="M3 10.5L12 3l9 7.5" />
      <path d="M5 9.5V20h14V9.5" />
    </svg>
  ),
  painel: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  metodo: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d="M4 20l4-4M4 20V9l4-2M4 20h4M12 16l4-4M12 16V6l4-2M12 16h4M20 12V4" />
    </svg>
  ),
  ai: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
    </svg>
  ),
  ceo: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d="M3 13a9 9 0 0 1 18 0" />
      <path d="M12 13l4-3" />
      <circle cx="12" cy="13" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  ),
};

const TABS: { id: Tab; labelKey: 'tabHome' | 'tabPainel' | 'tabMethod' | 'tabAI' | 'tabCEO' }[] = [
  { id: 'home', labelKey: 'tabHome' },
  { id: 'painel', labelKey: 'tabPainel' },
  { id: 'metodo', labelKey: 'tabMethod' },
  { id: 'ai', labelKey: 'tabAI' },
  { id: 'ceo', labelKey: 'tabCEO' },
];

export function NavBar() {
  const { tab, setTab, setOpenStep, lang } = useApp();

  return (
    <nav
      className="relative z-[6] flex flex-shrink-0 justify-around border-t border-white/[.08] bg-[rgba(8,19,44,.82)] px-2 pb-[26px] pt-[11px] backdrop-blur-[18px] desktop:col-start-1 desktop:row-start-1 desktop:row-end-3 desktop:flex-col desktop:justify-start desktop:gap-1.5 desktop:border-r desktop:border-t-0 desktop:bg-[rgba(6,14,32,.6)] desktop:px-4 desktop:py-[26px]"
    >
      {TABS.map(({ id, labelKey }) => {
        const active = tab === id;
        return (
          <button
            key={id}
            onClick={() => {
              setTab(id);
              setOpenStep(null);
            }}
            className={`flex flex-col items-center gap-1 rounded-nav px-1.5 py-1 transition-colors desktop:w-full desktop:flex-row desktop:justify-start desktop:gap-3.5 desktop:px-[15px] desktop:py-[13px] ${
              active ? 'text-gold-light' : 'text-muted'
            }`}
          >
            {ICONS[id]}
            <span className="text-[9.5px] font-semibold desktop:text-[14px]">{t(labelKey, lang)}</span>
          </button>
        );
      })}
    </nav>
  );
}
