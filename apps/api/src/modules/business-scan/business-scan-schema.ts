import { BusinessScanStepKey, IntegrationProvider } from '@prisma/client';

/**
 * 7MARKET BUSINESS SCAN™ — canonical field list per step. This is the source of
 * truth the API validates incoming section data against (unknown keys are
 * rejected, values are type-checked); the frontend mirrors these labels/types
 * in lib/business-scan-schema.ts to render the wizard. Keep the two in sync.
 */
export type FieldType = 'text' | 'textarea' | 'number' | 'currency' | 'percent' | 'url' | 'scale' | 'boolean' | 'select';

export interface SelectOption {
  value: string;
  labelPt: string;
  labelEn: string;
}

export interface FieldDef {
  key: string;
  labelPt: string;
  labelEn: string;
  type: FieldType;
  options?: SelectOption[];
}

export interface UploadDef {
  key: string;
  labelPt: string;
  labelEn: string;
}

export interface StepDef {
  key: BusinessScanStepKey;
  n: number; // 1-8, display order
  titlePt: string;
  titleEn: string;
  fields: FieldDef[];
  uploads: UploadDef[];
  integrations: IntegrationProvider[];
}

const PRAZO_OPTIONS: SelectOption[] = [
  { value: 'curto', labelPt: 'Curto prazo (até 1 ano)', labelEn: 'Short term (within 1 year)' },
  { value: 'medio', labelPt: 'Médio prazo (1-3 anos)', labelEn: 'Medium term (1-3 years)' },
  { value: 'longo', labelPt: 'Longo prazo (3+ anos)', labelEn: 'Long term (3+ years)' },
];

export const BUSINESS_SCAN_STEPS: StepDef[] = [
  {
    key: 'identificacao',
    n: 1,
    titlePt: 'Identificação da Empresa',
    titleEn: 'Company Identification',
    fields: [
      { key: 'razaoSocial', labelPt: 'Razão Social', labelEn: 'Legal Name', type: 'text' },
      { key: 'nomeFantasia', labelPt: 'Nome Fantasia', labelEn: 'Trade Name', type: 'text' },
      { key: 'documento', labelPt: 'CNPJ/NIF/VAT', labelEn: 'CNPJ/NIF/VAT', type: 'text' },
      { key: 'pais', labelPt: 'País', labelEn: 'Country', type: 'text' },
      { key: 'cidade', labelPt: 'Cidade', labelEn: 'City', type: 'text' },
      { key: 'endereco', labelPt: 'Endereço', labelEn: 'Address', type: 'text' },
      { key: 'site', labelPt: 'Site', labelEn: 'Website', type: 'url' },
      { key: 'redesSociais', labelPt: 'Redes Sociais', labelEn: 'Social Media', type: 'text' },
      { key: 'segmento', labelPt: 'Segmento', labelEn: 'Segment', type: 'text' },
      { key: 'anoFundacao', labelPt: 'Ano de Fundação', labelEn: 'Founding Year', type: 'number' },
      { key: 'numeroFuncionarios', labelPt: 'Número de Funcionários', labelEn: 'Number of Employees', type: 'number' },
      { key: 'numeroSocios', labelPt: 'Número de Sócios', labelEn: 'Number of Partners', type: 'number' },
    ],
    uploads: [
      { key: 'contratoSocial', labelPt: 'Contrato Social', labelEn: 'Articles of Incorporation' },
      { key: 'cartaoCnpj', labelPt: 'Cartão CNPJ', labelEn: 'Tax Registration Certificate' },
      { key: 'organograma', labelPt: 'Organograma', labelEn: 'Org Chart' },
    ],
    integrations: [],
  },
  {
    key: 'diagnosticar',
    n: 2,
    titlePt: 'Diagnosticar',
    titleEn: 'Diagnose',
    fields: [
      { key: 'maiorDesafio', labelPt: 'Maior desafio atual', labelEn: 'Biggest current challenge', type: 'textarea' },
      { key: 'objetivos', labelPt: 'Objetivos da empresa', labelEn: 'Company objectives', type: 'textarea' },
      { key: 'faturamentoAnual', labelPt: 'Faturamento anual', labelEn: 'Annual revenue', type: 'currency' },
      { key: 'metaFaturamento', labelPt: 'Meta de faturamento', labelEn: 'Revenue target', type: 'currency' },
      { key: 'quantidadeClientes', labelPt: 'Quantidade de clientes', labelEn: 'Number of customers', type: 'number' },
      { key: 'mercadoAtendido', labelPt: 'Mercado atendido', labelEn: 'Market served', type: 'text' },
      { key: 'gestao', labelPt: 'Gestão', labelEn: 'Management', type: 'scale' },
      { key: 'marketing', labelPt: 'Marketing', labelEn: 'Marketing', type: 'scale' },
      { key: 'comercial', labelPt: 'Comercial', labelEn: 'Sales', type: 'scale' },
      { key: 'financeiro', labelPt: 'Financeiro', labelEn: 'Finance', type: 'scale' },
      { key: 'operacao', labelPt: 'Operação', labelEn: 'Operations', type: 'scale' },
      { key: 'tecnologia', labelPt: 'Tecnologia', labelEn: 'Technology', type: 'scale' },
      { key: 'lideranca', labelPt: 'Liderança', labelEn: 'Leadership', type: 'scale' },
    ],
    uploads: [
      { key: 'planoEstrategico', labelPt: 'Plano Estratégico', labelEn: 'Strategic Plan' },
      { key: 'processos', labelPt: 'Processos', labelEn: 'Processes' },
      { key: 'organograma', labelPt: 'Organograma', labelEn: 'Org Chart' },
    ],
    integrations: [],
  },
  {
    key: 'qualificar',
    n: 3,
    titlePt: 'Qualificar',
    titleEn: 'Qualify',
    fields: [
      { key: 'produtos', labelPt: 'Produtos', labelEn: 'Products', type: 'textarea' },
      { key: 'servicos', labelPt: 'Serviços', labelEn: 'Services', type: 'textarea' },
      { key: 'ticketMedio', labelPt: 'Ticket Médio', labelEn: 'Average Ticket', type: 'currency' },
      { key: 'margem', labelPt: 'Margem', labelEn: 'Margin', type: 'percent' },
      { key: 'concorrentes', labelPt: 'Concorrentes', labelEn: 'Competitors', type: 'textarea' },
      { key: 'crm', labelPt: 'CRM', labelEn: 'CRM', type: 'text' },
      { key: 'erp', labelPt: 'ERP', labelEn: 'ERP', type: 'text' },
      { key: 'ferramentasUtilizadas', labelPt: 'Ferramentas utilizadas', labelEn: 'Tools used', type: 'textarea' },
    ],
    uploads: [
      { key: 'catalogo', labelPt: 'Catálogo', labelEn: 'Catalog' },
      { key: 'tabelaPrecos', labelPt: 'Tabela de Preços', labelEn: 'Price List' },
      { key: 'portfolio', labelPt: 'Portfólio', labelEn: 'Portfolio' },
    ],
    integrations: ['crm', 'erp'],
  },
  {
    key: 'organizar',
    n: 4,
    titlePt: 'Organizar',
    titleEn: 'Organize',
    fields: [
      { key: 'existeDre', labelPt: 'Existe DRE?', labelEn: 'Is there a P&L statement?', type: 'boolean' },
      { key: 'existeFluxoCaixa', labelPt: 'Existe Fluxo de Caixa?', labelEn: 'Is there a cash flow?', type: 'boolean' },
      { key: 'existePlanoContas', labelPt: 'Existe Plano de Contas?', labelEn: 'Is there a chart of accounts?', type: 'boolean' },
      { key: 'existeOrganograma', labelPt: 'Existe Organograma?', labelEn: 'Is there an org chart?', type: 'boolean' },
      { key: 'existeCrm', labelPt: 'Existe CRM?', labelEn: 'Is there a CRM?', type: 'boolean' },
      { key: 'existeErp', labelPt: 'Existe ERP?', labelEn: 'Is there an ERP?', type: 'boolean' },
      { key: 'existeDashboard', labelPt: 'Existe Dashboard?', labelEn: 'Is there a dashboard?', type: 'boolean' },
    ],
    uploads: [
      { key: 'dre', labelPt: 'DRE', labelEn: 'P&L Statement' },
      { key: 'fluxoCaixa', labelPt: 'Fluxo de Caixa', labelEn: 'Cash Flow' },
      { key: 'balanco', labelPt: 'Balanço', labelEn: 'Balance Sheet' },
      { key: 'kpis', labelPt: 'KPIs', labelEn: 'KPIs' },
    ],
    integrations: ['erp', 'contabilidade'],
  },
  {
    key: 'crescer',
    n: 5,
    titlePt: 'Crescer',
    titleEn: 'Grow',
    fields: [
      { key: 'marketing', labelPt: 'Marketing', labelEn: 'Marketing', type: 'boolean' },
      { key: 'googleAds', labelPt: 'Google Ads', labelEn: 'Google Ads', type: 'boolean' },
      { key: 'metaAds', labelPt: 'Meta Ads', labelEn: 'Meta Ads', type: 'boolean' },
      { key: 'seo', labelPt: 'SEO', labelEn: 'SEO', type: 'boolean' },
      { key: 'instagram', labelPt: 'Instagram', labelEn: 'Instagram', type: 'boolean' },
      { key: 'linkedin', labelPt: 'LinkedIn', labelEn: 'LinkedIn', type: 'boolean' },
      { key: 'numeroLeads', labelPt: 'Número de Leads', labelEn: 'Number of Leads', type: 'number' },
      { key: 'cac', labelPt: 'CAC', labelEn: 'CAC', type: 'currency' },
      { key: 'conversao', labelPt: 'Conversão', labelEn: 'Conversion', type: 'percent' },
      { key: 'pipelineComercial', labelPt: 'Pipeline Comercial', labelEn: 'Sales Pipeline', type: 'textarea' },
    ],
    uploads: [
      { key: 'planoMarketing', labelPt: 'Plano de Marketing', labelEn: 'Marketing Plan' },
      { key: 'relatorios', labelPt: 'Relatórios', labelEn: 'Reports' },
    ],
    integrations: ['google', 'meta', 'marketing', 'whatsapp'],
  },
  {
    key: 'capitalizar',
    n: 6,
    titlePt: 'Capitalizar',
    titleEn: 'Capitalize',
    fields: [
      { key: 'jaCaptouInvestimento', labelPt: 'Já captou investimentos?', labelEn: 'Raised investment before?', type: 'boolean' },
      { key: 'buscaInvestidores', labelPt: 'Busca investidores?', labelEn: 'Looking for investors?', type: 'boolean' },
      { key: 'linhaCredito', labelPt: 'Linha de crédito?', labelEn: 'Credit line?', type: 'boolean' },
      { key: 'patrimonio', labelPt: 'Patrimônio', labelEn: 'Assets', type: 'textarea' },
      { key: 'marcas', labelPt: 'Marcas', labelEn: 'Trademarks', type: 'text' },
      { key: 'patentes', labelPt: 'Patentes', labelEn: 'Patents', type: 'text' },
    ],
    uploads: [
      { key: 'valuation', labelPt: 'Valuation', labelEn: 'Valuation' },
      { key: 'capTable', labelPt: 'Cap Table', labelEn: 'Cap Table' },
      { key: 'documentosFinanceiros', labelPt: 'Documentos Financeiros', labelEn: 'Financial Documents' },
    ],
    integrations: ['open_banking', 'stripe'],
  },
  {
    key: 'escalar',
    n: 7,
    titlePt: 'Escalar',
    titleEn: 'Scale',
    fields: [
      { key: 'possuiFiliais', labelPt: 'Possui filiais?', labelEn: 'Has branches?', type: 'boolean' },
      { key: 'exporta', labelPt: 'Exporta?', labelEn: 'Exports?', type: 'boolean' },
      { key: 'importa', labelPt: 'Importa?', labelEn: 'Imports?', type: 'boolean' },
      { key: 'representantes', labelPt: 'Representantes?', labelEn: 'Sales reps?', type: 'boolean' },
      { key: 'franquias', labelPt: 'Franquias?', labelEn: 'Franchises?', type: 'boolean' },
      { key: 'mercadosAtendidos', labelPt: 'Mercados atendidos', labelEn: 'Markets served', type: 'textarea' },
    ],
    uploads: [
      { key: 'mapaComercial', labelPt: 'Mapa Comercial', labelEn: 'Sales Map' },
      { key: 'contratos', labelPt: 'Contratos', labelEn: 'Contracts' },
    ],
    integrations: [],
  },
  {
    key: 'valorizar',
    n: 8,
    titlePt: 'Valorizar',
    titleEn: 'Value',
    fields: [
      { key: 'pretendeVender', labelPt: 'Pretende vender a empresa?', labelEn: 'Planning to sell the company?', type: 'boolean' },
      { key: 'prazo', labelPt: 'Prazo', labelEn: 'Timeframe', type: 'select', options: PRAZO_OPTIONS },
      { key: 'sucessao', labelPt: 'Sucessão', labelEn: 'Succession planning', type: 'boolean' },
      { key: 'holding', labelPt: 'Holding', labelEn: 'Holding structure', type: 'boolean' },
      { key: 'planejamentoPatrimonial', labelPt: 'Planejamento Patrimonial', labelEn: 'Estate planning', type: 'boolean' },
    ],
    uploads: [
      { key: 'holding', labelPt: 'Holding', labelEn: 'Holding' },
      { key: 'planejamentoPatrimonial', labelPt: 'Planejamento Patrimonial', labelEn: 'Estate Planning' },
    ],
    integrations: [],
  },
];

export function getStepDef(key: BusinessScanStepKey): StepDef {
  const step = BUSINESS_SCAN_STEPS.find((s) => s.key === key);
  if (!step) throw new Error(`Unknown Business Scan step: ${key}`);
  return step;
}

/**
 * Bridges the "Diagnosticar" step's 1-10 self-assessment ratings into the
 * existing Diagnostic.respostas shape (growth-score.ts / Business Health
 * Engine factors), so finishing the Business Scan genuinely computes the
 * company's first real Growth Score and unlocks the Método 7M gate —
 * not just a promise that it "will feed" those systems.
 */
export function mapDiagnosticarToRespostas(data: Record<string, unknown>): Record<string, number> {
  const num = (v: unknown, fallback = 5) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
  const gestao = num(data.gestao);
  const lideranca = num(data.lideranca);
  return {
    saude_financeira: num(data.financeiro),
    previsibilidade_receita: num(data.comercial),
    risco_operacional: num(data.operacao),
    capacidade_crescimento: num(data.marketing),
    governanca: Math.round(((gestao + lideranca) / 2) * 10) / 10,
  };
}
