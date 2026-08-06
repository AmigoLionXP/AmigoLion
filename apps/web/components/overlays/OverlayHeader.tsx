export function BackIcon() {
  return (
    <svg width="12" height="20" viewBox="0 0 12 20" fill="none">
      <path d="M10 2L2 10l8 8" stroke="#c5d0e2" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M5 5l14 14M19 5L5 19" stroke="#c5d0e2" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function OverlayHeader({
  onClose,
  icon,
  kicker,
  title,
  subtitle,
}: {
  onClose: () => void;
  icon: React.ReactNode;
  kicker?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-shrink-0 items-center gap-3 border-b border-white/[.07] bg-[rgba(8,19,44,.55)] p-[58px_18px_14px] backdrop-blur-[14px]">
      <button
        onClick={onClose}
        className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[11px] border border-white/10 bg-white/[.06]"
        aria-label="close"
      >
        {icon}
      </button>
      <div className="min-w-0">
        {kicker && <div className="font-mono text-[10px] tracking-[.14em] text-gold">{kicker}</div>}
        <div className="mt-0.5 font-display text-xl font-bold leading-[1.1] text-white">{title}</div>
        {subtitle && <div className="mt-0.5 text-[11.5px] text-text-secondary">{subtitle}</div>}
      </div>
    </div>
  );
}
