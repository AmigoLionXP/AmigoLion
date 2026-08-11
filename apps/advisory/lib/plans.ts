/**
 * The 7M0-7M7 plan ladder — real pricing/commission reference data (matches `db/seed.ts`'s
 * `plans` rows and design_handoff_7m_advisory/README.md), not a claim about any specific
 * customer. Shared by the landing pricing table, the Admin "Arquitetura 7M" view, and the
 * revenue simulator so the numbers can't drift between screens.
 */
export type PlanTier = {
  code: string;
  name: string;
  accent: string;
  scaleLabel: string;
  priceLabel: string;
  priceCents: number;
  commissionPct: number;
  description: string;
};

export const PLAN_LADDER: PlanTier[] = [
  { code: '7M0', name: 'Entrada', accent: '#8FB4FF', scaleLabel: '1 CNPJ · 2 meses', priceLabel: 'R$ 497/mês', priceCents: 49700, commissionPct: 0, description: 'Porta de entrada no Método 7M — diagnóstico e primeiros passos.' },
  { code: '7M1', name: 'Empreendedor', accent: '#8FB4FF', scaleLabel: '1 CNPJ', priceLabel: 'R$ 1.000/mês', priceCents: 100000, commissionPct: 1, description: 'Uma empresa individual entra no método e roda os 7 passos.' },
  { code: '7M2', name: 'Núcleo', accent: '#8FB4FF', scaleLabel: 'até 12 empresas', priceLabel: 'R$ 2.000/mês', priceCents: 200000, commissionPct: 2, description: 'Grupo local de empresas que trocam indicações e permutas.' },
  { code: '7M3', name: 'Capítulo', accent: '#9db8ff', scaleLabel: 'até 40 empresas', priceLabel: 'R$ 3.000/mês', priceCents: 300000, commissionPct: 3, description: 'Capítulo formal com reuniões periódicas e metas de rede.' },
  { code: '7M4', name: 'Região', accent: '#E7C871', scaleLabel: 'multi-capítulo', priceLabel: 'R$ 4.000/mês', priceCents: 400000, commissionPct: 4, description: 'Vários capítulos de uma mesma cidade ou microrregião.' },
  { code: '7M5', name: 'Hub Estadual', accent: '#E7C871', scaleLabel: 'estado', priceLabel: 'R$ 5.000/mês', priceCents: 500000, commissionPct: 5, description: 'Coordenação estadual: eventos, capital e marca compartilhada.' },
  { code: '7M6', name: 'Rede Nacional', accent: '#E9611A', scaleLabel: 'país', priceLabel: 'R$ 6.000/mês', priceCents: 600000, commissionPct: 6, description: 'Malha nacional de hubs, com fundo de investimento próprio.' },
  { code: '7M7', name: 'Rede Global', accent: '#E9611A', scaleLabel: 'global', priceLabel: 'R$ 7.000/mês', priceCents: 700000, commissionPct: 7, description: 'Expansão internacional — o topo da arquitetura.' },
];

export const GIVE7_TYPES: { n: number; title: string; description: string }[] = [
  { n: 1, title: 'Referência', description: 'Indique um cliente para outro membro' },
  { n: 2, title: 'Conexão', description: 'Apresente duas pessoas que devem se conhecer' },
  { n: 3, title: 'Conhecimento', description: 'Compartilhe uma expertise ou aula' },
  { n: 4, title: 'Cliente', description: 'Traga uma oportunidade de venda' },
  { n: 5, title: 'Parceiro', description: 'Indique um fornecedor ou parceiro' },
  { n: 6, title: 'Oportunidade', description: 'Sinalize um edital, evento ou abertura' },
  { n: 7, title: 'Inteligência', description: 'Traga um dado ou insight de mercado' },
];

export const WHATSAPP_CONTACT = 'https://wa.me/41779578583';
