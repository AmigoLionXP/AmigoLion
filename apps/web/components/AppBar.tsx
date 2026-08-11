'use client';

import { useApp } from '@/lib/app-context';
import { companyView } from '@/lib/view-models';
import { LogoMark } from './Logo';

function GridIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#c5d0e2" strokeWidth="1.9">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#c5d0e2" strokeWidth="1.8">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

export function AppBar() {
  const { lang, toggleLang, company, more, setMore, setScreen } = useApp();
  const view = companyView(company, lang);

  return (
    <div
      className="relative z-[6] flex flex-shrink-0 items-center justify-between border-b border-white/[.06] bg-[rgba(8,19,44,.55)] px-5 pb-3 pt-[58px] backdrop-blur-[14px] desktop:col-start-2 desktop:row-start-1 desktop:px-8 desktop:py-5"
    >
      <div className="flex items-center gap-[11px]">
        <LogoMark size={30} radius={7} />
        <div>
          <div className="font-display text-[15px] font-bold leading-none text-white">{view.nome}</div>
          <div className="mt-[3px] font-mono text-[9.5px] uppercase tracking-[.12em] text-[#7f93b5]">{view.sectorLabel}</div>
        </div>
      </div>
      <div className="flex items-center gap-[9px]">
        <button
          onClick={() => {
            setScreen(null);
            setMore(!more);
          }}
          aria-label="Mais"
          className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-white/[.09] bg-white/[.05]"
        >
          <GridIcon />
        </button>
        <button
          onClick={toggleLang}
          className="rounded-[9px] border border-gold/30 bg-gold/[.12] px-[9px] py-[7px] font-mono text-[11px] font-semibold tracking-[.06em] text-gold-light"
        >
          {lang === 'pt' ? 'EN' : 'PT'}
        </button>
        <div className="relative flex h-9 w-9 items-center justify-center rounded-[10px] border border-white/[.09] bg-white/[.05]">
          <BellIcon />
          <div className="absolute right-[7px] top-[6px] h-[7px] w-[7px] rounded-full border-[1.5px] border-[#0b1e42] bg-gold-light" />
        </div>
      </div>
    </div>
  );
}
