'use client';

import { useState, useRef, useEffect } from 'react';
import { WHATSAPP_CONTACT } from '@/lib/plans';

type Msg = { who: 'me' | 'bot'; text: string };

const WELCOME =
  'Olá! Somos a 7M Advisory — consultores especializados em varejo e empreendedores. Criamos o Método 7M (especialistas humanos + IA, do diagnóstico ao patrimônio). Me conte do seu negócio, ou faça o diagnóstico gratuito e eu te mostro o próximo passo.';

/** Floating WhatsApp + "Guia 7M AI" chat button, present on every screen per the design spec. */
export function FloatingActions({ diagDone = false, level = '7M1' }: { diagDone?: boolean; level?: string }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([{ who: 'bot', text: WELCOME }]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, open]);

  useEffect(() => {
    const openChat = () => setOpen(true);
    window.addEventListener('open-7m-ai-chat', openChat);
    return () => window.removeEventListener('open-7m-ai-chat', openChat);
  }, []);

  async function send() {
    const question = input.trim();
    if (!question || sending) return;
    setInput('');
    setMsgs((m) => [...m, { who: 'me', text: question }]);
    setSending(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, diagDone, level }),
      });
      const data = await res.json();
      setMsgs((m) => [...m, { who: 'bot', text: res.ok ? data.reply : 'Não consegui responder agora — tente de novo em instantes.' }]);
    } catch {
      setMsgs((m) => [...m, { who: 'bot', text: 'Sem conexão no momento — tente de novo em instantes.' }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
        {open && (
          <div className="flex h-[70vh] max-h-[520px] w-[90vw] max-w-[360px] flex-col overflow-hidden rounded-2xl border border-gold/25 bg-navy-elevated shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-lg text-gold">✦</span>
                <span className="font-display text-sm font-bold text-white">Guia 7M AI</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-xl text-text-muted" aria-label="Fechar">
                ×
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {msgs.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-snug ${
                    m.who === 'bot' ? 'bg-white/5 text-text-secondary' : 'ml-auto bg-gold/15 text-white'
                  }`}
                >
                  {m.text}
                </div>
              ))}
              {sending && <div className="text-xs text-text-muted">digitando…</div>}
              <div ref={endRef} />
            </div>
            <div className="flex gap-2 border-t border-white/10 p-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Pergunte sobre o Método 7M..."
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-text-muted"
              />
              <button onClick={send} disabled={sending} className="rounded-lg bg-gradient-to-br from-gold to-gold-light px-3 py-2 font-bold text-navy disabled:opacity-40">
                →
              </button>
            </div>
          </div>
        )}
        <div className="flex gap-3">
          <a
            href={WHATSAPP_CONTACT}
            target="_blank"
            rel="noreferrer"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-2xl shadow-lg"
            aria-label="Falar no WhatsApp"
          >
            💬
          </a>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-gold to-gold-light text-2xl text-navy shadow-lg"
            aria-label="Guia 7M AI"
          >
            ✦
          </button>
        </div>
      </div>
    </>
  );
}
