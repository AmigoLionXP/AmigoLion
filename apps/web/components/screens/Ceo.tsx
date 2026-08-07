'use client';

import { useApp } from '@/lib/app-context';
import { t, L } from '@/lib/i18n';
import { MOCK_CEO } from '@/lib/mock-data';

const GREEN = '#5ee08a';
const GOLD = '#C99A2E';
const RED = '#F4776A';

export function CeoScreen() {
  const { lang, health } = useApp();

  // The Business Health Engine owns indicators 01-02 (Saúde/Crescimento); 03-05
  // (Caixa, Oportunidades, Próxima prioridade) belong to engines not built yet
  // (they need real cash data and the Matching/Next-Best-Action engines), so
  // those stay on the design's mock values until their turn comes.
  const rows = MOCK_CEO.map((k) => {
    if (k.n === '01' && health) {
      const score100 = Math.round(health.score / 10);
      const attention = health.band === 'critico' || health.band === 'fraco';
      const tag = attention
        ? { pt: 'Atenção', en: 'Watch' }
        : health.trend.direction === 'down'
          ? { pt: 'Desacelerando', en: 'Slowing' }
          : { pt: 'Estável', en: 'Stable' };
      return {
        ...k,
        value: `${score100}/100`,
        tag,
        tagColor: attention ? RED : health.trend.direction === 'down' ? GOLD : GREEN,
        tagBg: attention ? 'rgba(244,119,106,.14)' : health.trend.direction === 'down' ? 'rgba(201,154,46,.14)' : 'rgba(94,224,138,.14)',
      };
    }
    if (k.n === '02' && health) {
      const { deltaPct, direction } = health.trend;
      const sign = deltaPct > 0 ? '+' : '';
      const tag =
        direction === 'up'
          ? { pt: 'Em alta', en: 'Rising' }
          : direction === 'down'
            ? { pt: 'Queda', en: 'Declining' }
            : { pt: 'Estável', en: 'Stable' };
      return {
        ...k,
        value: `${sign}${deltaPct}%`,
        tag,
        tagColor: direction === 'down' ? RED : direction === 'up' ? GREEN : GOLD,
        tagBg: direction === 'down' ? 'rgba(244,119,106,.14)' : direction === 'up' ? 'rgba(94,224,138,.14)' : 'rgba(201,154,46,.14)',
      };
    }
    return k;
  });

  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-[.16em] text-gold">{t('ceoKick', lang)}</div>
      <div className="mt-1.5 font-display text-2xl font-bold tracking-[-.02em] text-white">{t('ceoTitle', lang)}</div>
      <div className="mt-[5px] text-[12.5px] leading-[1.4] text-text-secondary">{t('ceoSub', lang)}</div>
      {!health && (
        <div className="mt-3 text-[11px] text-text-secondary">
          {L('Indicadores 01-02 em modo offline (dados de exemplo)', 'Indicators 01-02 in offline mode (sample data)', lang)}
        </div>
      )}

      <div className="mt-[18px] flex flex-col gap-[11px]">
        {rows.map((k) => (
          <div key={k.n} className="flex items-center gap-4 rounded-2xl border border-white/[.08] bg-white/[.035] p-[16px_18px]">
            <div className="w-4 flex-shrink-0 font-mono text-[11px] text-muted">{k.n}</div>
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] text-text-secondary">{k.label[lang]}</div>
              <div className="mt-0.5 font-display text-[22px] font-bold leading-none text-white">
                {typeof k.value === 'string' ? k.value : k.value[lang]}
              </div>
            </div>
            <div
              className="flex flex-shrink-0 items-center gap-[7px] rounded-[9px] px-[11px] py-1.5 text-xs font-semibold"
              style={{ color: k.tagColor, background: k.tagBg }}
            >
              {k.tag[lang]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
