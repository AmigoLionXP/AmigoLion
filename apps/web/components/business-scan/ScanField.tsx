'use client';

import { Lang } from '@/lib/i18n';
import { FieldDef } from '@/lib/business-scan-schema';

interface Props {
  field: FieldDef;
  value: unknown;
  skipped: boolean;
  lang: Lang;
  onChange: (value: unknown) => void;
  onToggleSkip: () => void;
  onHelp?: () => void;
}

const inputBase =
  'w-full rounded-[12px] border border-white/10 bg-white/[.05] px-3.5 py-3 text-sm text-text placeholder:text-[#6b7f9e] focus:outline-none focus:border-gold/50 disabled:opacity-40';

export function ScanField({ field, value, skipped, lang, onChange, onToggleSkip, onHelp }: Props) {
  const label = lang === 'pt' ? field.labelPt : field.labelEn;
  const skipLabel = lang === 'pt' ? 'Não sei responder agora' : "I don't know yet";
  const skippedBadge = lang === 'pt' ? 'Pulado' : 'Skipped';
  const answerLabel = lang === 'pt' ? 'Responder' : 'Answer';

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <label className="text-[13px] font-semibold text-text-tertiary">{label}</label>
          {onHelp && (
            <button
              type="button"
              onClick={onHelp}
              aria-label={lang === 'pt' ? 'Como responder?' : 'How to answer?'}
              title={lang === 'pt' ? 'Como responder?' : 'How to answer?'}
              className="flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full border border-gold/30 text-[10px] font-bold text-gold"
            >
              ?
            </button>
          )}
        </div>
        {skipped && (
          <span className="rounded-md bg-white/[.06] px-2 py-0.5 text-[10px] font-semibold text-text-secondary">
            {skippedBadge}
          </span>
        )}
      </div>

      {!skipped && (
        <>
          {(field.type === 'text' || field.type === 'url') && (
            <input
              type={field.type === 'url' ? 'url' : 'text'}
              className={inputBase}
              value={(value as string) ?? ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={label}
            />
          )}

          {field.type === 'textarea' && (
            <textarea
              className={`${inputBase} min-h-[84px] resize-y`}
              value={(value as string) ?? ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={label}
            />
          )}

          {(field.type === 'number' || field.type === 'currency' || field.type === 'percent') && (
            <div className="relative">
              {field.type === 'currency' && (
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-text-secondary">
                  R$
                </span>
              )}
              <input
                type="number"
                inputMode="decimal"
                className={`${inputBase} ${field.type === 'currency' ? 'pl-10' : ''} ${field.type === 'percent' ? 'pr-9' : ''}`}
                value={(value as number) ?? ''}
                onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
                placeholder="0"
                min={0}
                max={field.type === 'percent' ? 100 : undefined}
              />
              {field.type === 'percent' && (
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-text-secondary">
                  %
                </span>
              )}
            </div>
          )}

          {field.type === 'scale' && (
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
                const active = value === n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => onChange(n)}
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] font-mono text-[13px] font-semibold"
                    style={{
                      background: active ? 'linear-gradient(140deg,#C99A2E,#F4D48A)' : 'rgba(255,255,255,.05)',
                      color: active ? '#0B2149' : '#8ea0bc',
                      border: `1px solid ${active ? 'transparent' : 'rgba(255,255,255,.1)'}`,
                    }}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          )}

          {field.type === 'boolean' && (
            <div className="flex gap-2">
              {[
                { v: true, l: lang === 'pt' ? 'Sim' : 'Yes' },
                { v: false, l: lang === 'pt' ? 'Não' : 'No' },
              ].map((opt) => {
                const active = value === opt.v;
                return (
                  <button
                    key={String(opt.v)}
                    type="button"
                    onClick={() => onChange(opt.v)}
                    className="flex-1 rounded-[12px] py-2.5 text-sm font-semibold"
                    style={{
                      background: active ? 'linear-gradient(140deg,#C99A2E,#F4D48A)' : 'rgba(255,255,255,.05)',
                      color: active ? '#0B2149' : '#cdd9ef',
                      border: `1px solid ${active ? 'transparent' : 'rgba(255,255,255,.1)'}`,
                    }}
                  >
                    {opt.l}
                  </button>
                );
              })}
            </div>
          )}

          {field.type === 'select' && (
            <div className="flex flex-col gap-2">
              {field.options?.map((opt) => {
                const active = value === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange(opt.value)}
                    className="rounded-[12px] px-3.5 py-2.5 text-left text-sm font-semibold"
                    style={{
                      background: active ? 'rgba(201,154,46,.16)' : 'rgba(255,255,255,.05)',
                      color: active ? '#F4D48A' : '#cdd9ef',
                      border: `1px solid ${active ? 'rgba(201,154,46,.4)' : 'rgba(255,255,255,.1)'}`,
                    }}
                  >
                    {lang === 'pt' ? opt.labelPt : opt.labelEn}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      <button
        type="button"
        onClick={onToggleSkip}
        className="mt-1.5 font-mono text-[10.5px] text-text-secondary underline decoration-dotted underline-offset-2"
      >
        {skipped ? answerLabel : skipLabel}
      </button>
    </div>
  );
}
