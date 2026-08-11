import { Injectable } from '@nestjs/common';
import { AgentProvider, AgentRunInput, AgentRunOutput } from './agent-provider.interface';

const REGULATED_KEYWORDS = [
  'contáb', 'contab', 'jurídic', 'juridic', 'tributár', 'tributar', 'crédito', 'credito',
  'capital', 'legal', 'tax', 'accounting', 'lawsuit', 'valuation', 'compliance',
];

const CANNED: Record<string, { pt: string; en: string }> = {
  publico: {
    pt: 'Analisei sua base: 312 clientes ativos, ticket médio R$ 270 e concentração em poucos canais. O ponto crítico: 0 novos leads qualificados nos últimos 90 dias. Recomendo mapear 2 públicos-alvo prioritários, definir a proposta de valor por perfil e abrir uma campanha de prospecção. Quer que eu monte o mapa de público completo?',
    en: 'I analysed your base: 312 active customers, avg ticket R$ 270 and heavy reliance on a few channels. The critical point: 0 new qualified leads in the last 90 days. I recommend mapping 2 priority audiences, defining the value proposition per profile and launching a prospecting campaign. Shall I build the full audience map?',
  },
  score: {
    pt: 'Seu Score 612 (Regular) segue lógica de crédito bancário: Diagnóstico 92 e Finanças 74 puxam pra cima, mas Vendas 41 e Governança 38 seguram o total. O maior ganho rápido está em Vendas — subir a prospecção elevaria seu Score para ~680.',
    en: 'Your Score 612 (Fair) follows bank-credit logic: Diagnosis 92 and Finance 74 lift it, but Sales 41 and Governance 38 hold it back. The quickest win is Sales — improving prospecting would raise your Score to ~680.',
  },
  plano: {
    pt: 'Plano de prospecção em 3 semanas: 1) Semana 1 — análise de público + oferta de entrada. 2) Semana 2 — campanha geolocalizada + captura de leads. 3) Semana 3 — script de conversão no WhatsApp e follow-up. Meta: 40 leads qualificados/mês. Gerar as tarefas no seu painel?',
    en: '3-week prospecting plan: 1) Week 1 — audience analysis + entry offer. 2) Week 2 — geo campaign + lead capture. 3) Week 3 — WhatsApp conversion script and follow-up. Target: 40 qualified leads/month. Generate the tasks on your board?',
  },
  default: {
    pt: 'Entendido. Estou correlacionando isso com o seu Growth Score e o seu Método 7M para trazer a próxima melhor ação. Pode me dar mais detalhes?',
    en: 'Got it. I am correlating this with your Growth Score and your 7M Method to bring you the next best action. Can you give me more detail?',
  },
};

function classify(message: string): 'low' | 'high' {
  const lower = message.toLowerCase();
  return REGULATED_KEYWORDS.some((kw) => lower.includes(kw)) ? 'high' : 'low';
}

function pickCanned(message: string): { pt: string; en: string } {
  const lower = message.toLowerCase();
  if (/(público|publico|audience|lead)/.test(lower)) return CANNED.publico;
  if (/(score)/.test(lower)) return CANNED.score;
  if (/(plano|plan|prospec)/.test(lower)) return CANNED.plano;
  return CANNED.default;
}

/** Offline-friendly default AgentProvider; swap via AGENT_PROVIDER env for a real LLM backend. */
@Injectable()
export class MockAgentProvider extends AgentProvider {
  async run(input: AgentRunInput): Promise<AgentRunOutput> {
    const canned = pickCanned(input.message);
    return {
      reply: input.lang === 'en' ? canned.en : canned.pt,
      riskLevel: classify(input.message),
    };
  }
}
