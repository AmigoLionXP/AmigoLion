'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Logo } from './Logo';
import { FloatingActions } from './FloatingActions';
import { createClient } from '@/lib/supabase/client';
import type { Role } from '@/lib/auth-types';

const MEMBER_NAV = [
  { href: '/dashboard', icon: '◈', label: 'Minha empresa' },
  { href: '/dashboard/pipeline', icon: '▤', label: 'Minha esteira 7 passos' },
  { href: '/dashboard/method', icon: '◆', label: 'O Método 7M' },
  { href: '/dashboard/agents', icon: '✦', label: 'Meus agentes de IA' },
  { href: '/dashboard/network', icon: '◇', label: 'Rede 7M · Circle' },
  { href: '/dashboard/marketplace', icon: '▦', label: 'Marketplace' },
];

const REP_NAV = [
  { href: '/dashboard', icon: '◈', label: 'Meu painel' },
  { href: '/dashboard/rep/network', icon: '◇', label: 'Minha rede' },
  { href: '/dashboard/rep/commissions', icon: '∑', label: 'Minhas comissões' },
  { href: '/dashboard/rep/events', icon: '◉', label: 'Meus eventos' },
];

const ADMIN_NAV = [
  { href: '/dashboard', icon: '▚', label: 'Visão geral · todas' },
  { href: '/dashboard/admin/regions', icon: '◉', label: 'Praças & capítulos' },
  { href: '/dashboard/admin/arch', icon: '⬢', label: 'Arquitetura 7M' },
  { href: '/dashboard/admin/simulator', icon: '∑', label: 'Simulador de receita' },
  { href: '/dashboard/marketplace', icon: '▦', label: 'Moderar marketplace' },
  { href: '/dashboard/admin/users', icon: '⚙', label: 'Advisory Admin' },
];

const PANEL_LABEL: Record<Role, string> = { admin: 'Advisory Admin', rep: 'Advisory Rep', member: 'Área do 7M Member' };

export function DashboardShell({ role, fullName, children }: { role: Role; fullName: string; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const nav = role === 'admin' ? ADMIN_NAV : role === 'rep' ? REP_NAV : MEMBER_NAV;

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <div className="grid h-screen grid-cols-1 overflow-hidden md:grid-cols-[250px_1fr]">
      <aside className="hidden flex-col gap-1 overflow-y-auto border-r border-white/[.06] bg-navy-elevated p-4 md:flex">
        <div className="px-2 pb-5 pt-1">
          <Logo />
        </div>
        <div className="px-2 pb-2 font-mono text-[10.5px] uppercase tracking-[.18em] text-text-dim">{PANEL_LABEL[role]}</div>
        {nav.map((n) => {
          const active = n.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold ${
                active ? 'border border-gold/30 bg-gold/[.14] text-gold-light' : 'border border-transparent text-text-tertiary hover:bg-white/[.03]'
              }`}
            >
              <span className="text-base">{n.icon}</span>
              {n.label}
            </Link>
          );
        })}
        <div className="flex-1" />
        <div className="truncate px-2 pb-1 text-xs text-text-muted">{fullName}</div>
        <button onClick={signOut} className="rounded-xl border border-white/10 px-3.5 py-2.5 text-left text-sm font-semibold text-text-tertiary hover:bg-white/[.03]">
          Sair
        </button>
        <Link href="/" className="rounded-xl border border-white/10 px-3.5 py-2.5 text-sm font-semibold text-text-tertiary hover:bg-white/[.03]">
          ← Voltar ao site
        </Link>
      </aside>

      <main className="overflow-y-auto bg-navy">
        {/* mobile nav */}
        <div className="flex gap-2 overflow-x-auto border-b border-white/[.06] bg-navy-elevated p-3 md:hidden">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`flex-shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold ${
                pathname === n.href ? 'bg-gold/15 text-gold-light' : 'bg-white/5 text-text-tertiary'
              }`}
            >
              {n.icon} {n.label}
            </Link>
          ))}
          <button onClick={signOut} className="flex-shrink-0 rounded-full bg-white/5 px-3.5 py-2 text-xs font-semibold text-text-tertiary">
            Sair
          </button>
        </div>
        <div className="px-5 py-8 md:px-9 md:py-9">{children}</div>
      </main>
      <FloatingActions diagDone level="7M1" />
    </div>
  );
}
