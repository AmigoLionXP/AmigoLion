import { BusinessScanStepKey } from '@prisma/client';
import { FieldDef, getStepDef } from './business-scan-schema';

interface Bi {
  pt: string;
  en: string;
}

/** 7M Copilot™.AI — welcome message shown when a step opens. */
export const STEP_INTROS: Record<BusinessScanStepKey, Bi> = {
  identificacao: {
    pt: 'Bem-vindo à etapa "Identificação". Vamos registrar os dados formais da sua empresa — isso garante que tudo o mais no 7MARKET (contratos, relatórios, comissões) esteja correto desde o início.',
    en: 'Welcome to the "Identification" step. Let\'s register your company\'s formal details — this keeps everything else in 7MARKET (contracts, reports, commissions) correct from day one.',
  },
  diagnosticar: {
    pt: 'Bem-vindo à etapa "Diagnosticar". Nesta fase queremos entender a situação atual da sua empresa. Não existem respostas certas ou erradas. Quanto mais precisas forem as informações, mais personalizadas serão as recomendações do Método 7M.',
    en: 'Welcome to the "Diagnose" step. In this phase we want to understand your company\'s current situation. There are no right or wrong answers. The more precise the information, the more personalized the Método 7M recommendations will be.',
  },
  qualificar: {
    pt: 'Bem-vindo à etapa "Qualificar". Aqui detalhamos o que você vende e como vende — produtos, serviços, preços e as ferramentas que já usa. Isso ajuda a 7M AI a entender seu modelo de negócio.',
    en: 'Welcome to the "Qualify" step. Here we detail what you sell and how — products, services, pricing and the tools you already use. This helps 7M AI understand your business model.',
  },
  organizar: {
    pt: 'Bem-vindo à etapa "Organizar". Vamos mapear o quanto sua operação já está estruturada — controles financeiros, sistemas e organograma. Não se preocupe se a resposta for "não" em várias — é exatamente isso que o Método 7M ajuda a resolver.',
    en: 'Welcome to the "Organize" step. Let\'s map how structured your operation already is — financial controls, systems and org chart. Don\'t worry if the answer is "no" to several — that\'s exactly what the Método 7M helps fix.',
  },
  crescer: {
    pt: 'Bem-vindo à etapa "Crescer". Conte pra gente como sua empresa hoje atrai e converte clientes. Esses dados alimentam diretamente as recomendações de marketing e vendas da 7M AI.',
    en: 'Welcome to the "Grow" step. Tell us how your company attracts and converts customers today. This data directly feeds 7M AI\'s marketing and sales recommendations.',
  },
  capitalizar: {
    pt: 'Bem-vindo à etapa "Capitalizar". Aqui entendemos sua relação com capital — investimentos, crédito e ativos. Essas informações são sensíveis; ficam protegidas e visíveis só para você e seu Growth Manager.',
    en: 'Welcome to the "Capitalize" step. Here we understand your relationship with capital — investment, credit and assets. This information is sensitive; it stays protected and visible only to you and your Growth Manager.',
  },
  escalar: {
    pt: 'Bem-vindo à etapa "Escalar". Queremos saber se sua empresa já opera além de uma única unidade ou mercado — isso muda bastante o plano de expansão que a 7M AI vai recomendar.',
    en: 'Welcome to the "Scale" step. We want to know if your company already operates beyond a single unit or market — this significantly changes the expansion plan 7M AI will recommend.',
  },
  valorizar: {
    pt: 'Bem-vindo à etapa "Valorizar". A última etapa — vamos entender seus planos de longo prazo para a empresa: venda, sucessão ou estruturação patrimonial.',
    en: 'Welcome to the "Value" step. The last one — let\'s understand your long-term plans for the company: sale, succession or estate structuring.',
  },
};

/** Curated example answers for the single most important open question in the scan. */
export const CHALLENGE_EXAMPLES: Bi[] = [
  { pt: 'Poucos clientes novos', en: 'Too few new customers' },
  { pt: 'Baixa conversão de vendas', en: 'Low sales conversion' },
  { pt: 'Fluxo de caixa apertado', en: 'Tight cash flow' },
  { pt: 'Dificuldade para contratar pessoas', en: 'Hard to hire people' },
  { pt: 'Organização interna', en: 'Internal organisation' },
  { pt: 'Marketing ineficiente', en: 'Ineffective marketing' },
  { pt: 'Expansão para novos mercados', en: 'Expansion into new markets' },
];

const FIELD_HELP_OVERRIDES: Partial<Record<string, Bi & { examples?: Bi[] }>> = {
  'diagnosticar.maiorDesafio': {
    pt: 'Pense no principal obstáculo que impede sua empresa de crescer neste momento.',
    en: 'Think about the main obstacle stopping your company from growing right now.',
    examples: CHALLENGE_EXAMPLES,
  },
  'diagnosticar.faturamentoAnual': {
    pt: 'Informe o faturamento bruto dos últimos 12 meses. Se você não souber o valor exato, pode informar uma estimativa. Também é possível conectar seu sistema financeiro ou enviar a DRE para preenchimento automático.',
    en: 'Enter your gross revenue over the last 12 months. If you don\'t know the exact figure, an estimate works. You can also connect your financial system or send your P&L for automatic filling.',
  },
  'identificacao.documento': {
    pt: 'No Brasil, informe o CNPJ (formato 00.000.000/0000-00). Fora do Brasil, use o equivalente local: NIF em Portugal, VAT na União Europeia.',
    en: 'In Brazil, enter your CNPJ (00.000.000/0000-00). Outside Brazil, use the local equivalent: NIF in Portugal, VAT in the EU.',
  },
  'qualificar.ticketMedio': {
    pt: 'É o valor médio que cada cliente paga por compra ou contrato. Some o faturamento de um período e divida pelo número de vendas nesse período.',
    en: 'The average amount each customer pays per purchase or contract. Add up revenue for a period and divide by the number of sales in it.',
  },
  'crescer.cac': {
    pt: 'Custo de Aquisição de Cliente: quanto você gasta em marketing e vendas, em média, para conquistar um cliente novo.',
    en: 'Customer Acquisition Cost: how much you spend on marketing and sales, on average, to win one new customer.',
  },
};

function genericHelp(field: FieldDef): Bi {
  switch (field.type) {
    case 'scale':
      return {
        pt: `Dê uma nota de 1 a 10 para "${field.labelPt}" — 1 significa que praticamente não existe estrutura nessa área, 10 significa que está em um nível excelente, difícil de melhorar.`,
        en: `Rate "${field.labelEn}" from 1 to 10 — 1 means there is almost no structure in this area, 10 means it is at an excellent level, hard to improve further.`,
      };
    case 'boolean':
      return {
        pt: `Responda Sim ou Não. Se não tiver certeza, escolha a opção mais próxima da realidade — dá pra ajustar depois.`,
        en: `Answer Yes or No. If unsure, pick whichever is closer to reality — you can adjust it later.`,
      };
    case 'currency':
      return {
        pt: `Informe o valor em reais (R$). Uma estimativa arredondada já ajuda bastante — não precisa ser exato.`,
        en: `Enter the amount (in your currency). A rounded estimate is already very helpful — it doesn't need to be exact.`,
      };
    case 'percent':
      return {
        pt: `Informe um percentual entre 0 e 100. Se não souber o número exato, uma estimativa serve.`,
        en: `Enter a percentage between 0 and 100. If you don't know the exact number, an estimate works.`,
      };
    case 'select':
      return {
        pt: `Escolha a opção que melhor descreve o seu caso entre as alternativas abaixo.`,
        en: `Pick whichever option below best describes your situation.`,
      };
    case 'url':
      return {
        pt: `Cole o link completo (com https://). Se sua empresa não tiver, pode pular esta pergunta.`,
        en: `Paste the full link (including https://). If your company doesn't have one, you can skip this question.`,
      };
    default:
      return {
        pt: `Responda com suas palavras — não existe formato certo ou errado. Se preferir, você pode enviar um documento ou responder por voz.`,
        en: `Answer in your own words — there's no right or wrong format. You can also send a document or answer by voice instead.`,
      };
  }
}

export function getFieldHelp(stepKey: BusinessScanStepKey, fieldKey: string, lang: 'pt' | 'en') {
  const step = getStepDef(stepKey);
  const field = step.fields.find((f) => f.key === fieldKey);
  if (!field) return null;
  const override = FIELD_HELP_OVERRIDES[`${stepKey}.${fieldKey}`];
  const base = override ?? genericHelp(field);
  return {
    label: lang === 'pt' ? field.labelPt : field.labelEn,
    help: base[lang],
    examples: override?.examples?.map((e) => e[lang]) ?? [],
  };
}
