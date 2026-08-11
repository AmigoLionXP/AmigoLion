export type Lang = 'pt' | 'en';

export const dict = {
  growthScore: { pt: 'Growth Score', en: 'Growth Score' },
  myEvolution: { pt: 'Minha evolução no Método 7M', en: 'My 7M Method journey' },
  seeAll: { pt: 'Ver tudo', en: 'See all' },
  dashboard: { pt: 'Painel', en: 'Dashboard' },
  dashboardSub: { pt: 'Sua empresa em 6 números.', en: 'Your company in 6 numbers.' },
  method: { pt: 'Método 7M', en: '7M Method' },
  methodTitle: { pt: 'Do diagnóstico ao patrimônio', en: 'From diagnosis to wealth' },
  aiSub: { pt: 'online · conhece sua empresa', en: 'online · knows your company' },
  aiPlaceholder: { pt: 'Pergunte à 7M AI…', en: 'Ask 7M AI…' },
  ceoKick: { pt: 'Cabine do CEO', en: 'CEO Cockpit' },
  ceoTitle: { pt: 'Sua empresa em 30 segundos', en: 'Your company in 30 seconds' },
  ceoSub: { pt: 'Cinco indicadores. Um olhar. Uma decisão.', en: 'Five indicators. One glance. One decision.' },
  more: { pt: 'Mais', en: 'More' },
  moreSub: { pt: 'Todas as áreas do seu Growth Office', en: 'All areas of your Growth Office' },
  tabHome: { pt: 'Início', en: 'Home' },
  tabPainel: { pt: 'Painel', en: 'Board' },
  tabMethod: { pt: 'Método', en: 'Method' },
  tabAI: { pt: '7M AI', en: '7M AI' },
  tabCEO: { pt: 'CEO', en: 'CEO' },
  specialist: { pt: 'Especialista', en: 'Specialist' },
  talk: { pt: 'Falar', en: 'Talk' },
  progress: { pt: 'Progresso', en: 'Progress' },
  deadline: { pt: 'Prazo', en: 'Deadline' },
  checklist: { pt: 'Checklist', en: 'Checklist' },
  resources: { pt: 'Recursos', en: 'Resources' },
  loading: { pt: 'Carregando…', en: 'Loading…' },
  send: { pt: 'Enviar', en: 'Send' },
  back: { pt: 'Voltar', en: 'Back' },
} as const;

export type DictKey = keyof typeof dict;

export function t(key: DictKey, lang: Lang): string {
  return dict[key][lang];
}

/** Small inline helper for one-off bilingual strings not worth a dict entry. */
export function L(pt: string, en: string, lang: Lang): string {
  return lang === 'pt' ? pt : en;
}
