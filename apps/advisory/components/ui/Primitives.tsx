import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-white/[.07] bg-white/[.03] p-6 ${className}`}>{children}</div>;
}

export function Kicker({ children, color = 'text-gold' }: { children: ReactNode; color?: string }) {
  return <div className={`font-mono text-[11px] uppercase tracking-[.14em] ${color}`}>{children}</div>;
}

export function Kpi({ label, value, sub, subColor = 'text-gold' }: { label: string; value: string; sub?: string; subColor?: string }) {
  return (
    <Card>
      <div className="font-mono text-[11px] uppercase tracking-[.12em] text-text-muted">{label}</div>
      <div className="mt-2 font-display text-3xl font-bold text-white">{value}</div>
      {sub && <div className={`mt-0.5 text-sm ${subColor}`}>{sub}</div>}
    </Card>
  );
}

export function ProgressBar({ pct, color = '#C99A2E' }: { pct: number; color?: string }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
      <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }} />
    </div>
  );
}

export function Badge({ children, bg, color }: { children: ReactNode; bg: string; color: string }) {
  return (
    <span className="rounded-full px-3 py-1 font-mono text-[11px]" style={{ background: bg, color }}>
      {children}
    </span>
  );
}

export function GoldButton({ children, onClick, type = 'button', disabled, className = '' }: { children: ReactNode; onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean; className?: string }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl bg-gradient-to-br from-gold to-gold-light px-6 py-3 font-bold text-navy disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, className = '' }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white ${className}`}
    >
      {children}
    </button>
  );
}
