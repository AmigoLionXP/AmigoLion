'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/Logo';
import { GoldButton } from '@/components/ui/Primitives';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<'login' | 'signup'>(params.get('mode') === 'signup' ? 'signup' : 'login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function afterAuth() {
    const res = await fetch('/api/me');
    if (!res.ok) {
      setError('Não foi possível carregar seu perfil. Tente novamente.');
      return;
    }
    const me = await res.json();
    if (me.role === 'admin' || me.role === 'rep') router.push('/dashboard');
    else router.push(me.hasCompany ? '/dashboard' : '/dashboard/setup');
    router.refresh();
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError('E-mail ou senha incorretos.');
      setLoading(false);
      return;
    }
    await afterAuth();
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createClient();
    // Only `full_name` is passed here — role is never client-controlled, the DB trigger always
    // assigns 'member' regardless of what a signup call claims (see 0001_rls.sql).
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (authError) {
      setError(authError.message.includes('already registered') ? 'Este e-mail já tem conta — faça login.' : 'Não foi possível criar a conta.');
      setLoading(false);
      return;
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError('Conta criada — confirme seu e-mail para entrar (se a confirmação estiver ativada) ou faça login.');
      setLoading(false);
      setMode('login');
      return;
    }
    router.push('/dashboard/setup');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(120%_100%_at_50%_0%,#17140c_0%,#0a1436_60%)] p-6">
      <div className="w-full max-w-[400px] rounded-3xl border border-gold/25 bg-navy-elevated p-9">
        <div className="mb-2 flex justify-center">
          <Logo size={44} />
        </div>
        <div className="mb-6 text-center text-sm text-text-muted">
          {mode === 'login' ? 'Acesso à plataforma · empreendedor ou 7M Advisory' : 'Cadastre sua conta de Member'}
        </div>

        <div className="mb-6 flex rounded-xl border border-white/10 bg-white/[.03] p-1">
          <button onClick={() => setMode('login')} className={`flex-1 rounded-lg py-2 text-sm font-semibold ${mode === 'login' ? 'bg-gold/15 text-gold-light' : 'text-text-muted'}`}>
            Entrar
          </button>
          <button onClick={() => setMode('signup')} className={`flex-1 rounded-lg py-2 text-sm font-semibold ${mode === 'signup' ? 'bg-gold/15 text-gold-light' : 'text-text-muted'}`}>
            Cadastrar
          </button>
        </div>

        <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="text-sm font-semibold text-text-tertiary">Seu nome</label>
              <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-white outline-none" />
            </div>
          )}
          <div>
            <label className="text-sm font-semibold text-text-tertiary">E-mail</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-white outline-none" />
          </div>
          <div>
            <label className="text-sm font-semibold text-text-tertiary">Senha</label>
            <input required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-white outline-none" />
          </div>
          {error && <p className="text-sm text-orange">{error}</p>}
          <GoldButton type="submit" disabled={loading} className="w-full">
            {loading ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </GoldButton>
        </form>

        <Link href="/" className="mt-4 block text-center text-sm text-text-muted hover:text-white">
          ← Voltar ao site
        </Link>

        <div className="mt-6 border-t border-white/[.07] pt-4 text-center font-mono text-[11px] leading-relaxed text-text-dim">
          Demo · 7M Member: <span className="text-blue">member@7madvisory.com</span>
          <br />
          Demo · Advisory Rep: <span className="text-blue">rep@7madvisory.com</span>
          <br />
          Demo · Advisory Admin: <span className="text-gold-light">admin@7madvisory.com</span>
          <br />
          senha: demo1234
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
