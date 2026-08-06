'use client';

import { useState } from 'react';
import { useApp } from '@/lib/app-context';
import { t } from '@/lib/i18n';

export function AiScreen() {
  const { lang, chat, chatChips, sendChat, chatBusy } = useApp();
  const [value, setValue] = useState('');

  function submit() {
    if (!value.trim() || chatBusy) return;
    sendChat(value);
    setValue('');
  }

  return (
    <div className="flex min-h-[560px] flex-col">
      <div className="flex items-center gap-3 border-b border-white/[.07] pb-[14px]">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-[13px] text-xl"
          style={{ background: 'linear-gradient(140deg,#12336e,#8FB4FF)' }}
        >
          ✦
        </div>
        <div>
          <div className="font-display text-[17px] font-bold text-white">7M AI</div>
          <div className="flex items-center gap-1.5 text-[11.5px] text-ai-blue">
            <span className="h-1.5 w-1.5 rounded-full bg-status-green" />
            {t('aiSub', lang)}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 py-4">
        {chat.map((m, i) => {
          const isUser = m.role === 'user';
          return (
            <div key={i} className={`flex animate-msgin ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div
                className={
                  isUser
                    ? 'max-w-[82%] rounded-[16px_16px_4px_16px] p-[12px_15px] text-[13.5px] font-semibold leading-[1.5] text-navy'
                    : 'max-w-[88%] rounded-[16px_16px_16px_4px] border border-white/[.09] bg-white/[.05] p-[13px_15px] text-[13.5px] leading-[1.55] text-text'
                }
                style={isUser ? { background: 'linear-gradient(140deg,#C99A2E,#F4D48A)' } : undefined}
              >
                {lang === 'pt' ? m.pt : m.en}
              </div>
            </div>
          );
        })}
        {chatBusy && (
          <div className="flex justify-start">
            <div className="max-w-[88%] rounded-[16px_16px_16px_4px] border border-white/[.09] bg-white/[.05] p-[13px_15px] text-[13.5px] text-text-secondary">
              …
            </div>
          </div>
        )}
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {chatChips.map((c, i) => (
          <button
            key={i}
            onClick={() => sendChat(c.question[lang])}
            className="rounded-full border border-ai-blue/[.28] bg-ai-blue/10 px-[14px] py-[9px] text-[12.5px] text-text-tertiary"
          >
            {c.label[lang]}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2.5 rounded-[15px] border border-white/10 bg-white/[.05] p-[6px_6px_6px_16px]">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder={t('aiPlaceholder', lang)}
          className="flex-1 bg-transparent text-sm text-text placeholder:text-[#6b7f9e] focus:outline-none"
        />
        <button
          onClick={submit}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[11px]"
          style={{ background: 'linear-gradient(140deg,#C99A2E,#F4D48A)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0B2149" strokeWidth="2.2">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
