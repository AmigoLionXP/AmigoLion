import type { ReactNode } from 'react';

export function ViewHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">{title}</h1>
        <p className="text-sm text-text-muted">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
