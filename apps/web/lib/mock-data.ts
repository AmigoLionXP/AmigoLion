// Fallback data mirroring design_handoff_7market_app/"7MARKET App.dc.html" — used until the
// API responds (offline dev, or while a request is in flight) so screens never render empty.
import type { MethodStepDto, TaskDto } from './api';

export interface Bi {
  pt: string;
  en: string;
}

export const MOCK_COMPANY = {
  nome: '7MARKET',
  setor: { pt: 'Sua empresa · Growth Office', en: 'Your company · Growth Office' } as Bi,
  growthScore: 612,
  band: { pt: 'Regular — em evolução', en: 'Fair — improving' } as Bi,
  meta: { pt: 'Meta: Score 750 até dez/26', en: 'Goal: Score 750 by Dec/26' } as Bi,
  revisao: { pt: 'Revisão em 14 dias', en: 'Review in 14 days' } as Bi,
  nivel7m: 3,
  diagnosticStatus: 'complete' as const,
  gargalo: { pt: 'falta de clientes novos', en: 'a lack of new customers' } as Bi,
  manager: { name: 'Marcelo Reis', nivel: 4 },
};

export const NBA = {
  tag: { pt: 'Prioridade do dia', en: 'Priority of the day' } as Bi,
  title: {
    pt: 'Você está perdendo receita por falta de clientes novos.',
    en: 'You are losing revenue from a lack of new customers.',
  } as Bi,
  why: {
    pt: 'Nos últimos 90 dias sua receita ficou estável, mas a base de clientes parou: 0 leads qualificados registrados. Sem prospecção, o próximo trimestre tende a cair.',
    en: 'Over the last 90 days your revenue stayed flat, but your customer base stalled: 0 qualified leads recorded. Without prospecting, next quarter tends to fall.',
  } as Bi,
  rec: {
    pt: 'recomendo uma análise detalhada do seu público e, em seguida, uma estratégia de marketing focada em prospecção de leads.',
    en: 'I recommend a detailed analysis of your audience and then a marketing strategy focused on lead prospecting.',
  } as Bi,
  cta: { pt: 'Resolver agora', en: 'Solve it now' } as Bi,
  targetStepN: 4,
};

export const MOCK_STEPS: MethodStepDto[] = [
  { n: 1, code: '7M1', verbPt: 'Diagnosticar', verbEn: 'Diagnose', specialistRolePt: '7M AI · Growth Analyst', specialistRoleEn: '7M AI · Growth Analyst', pct: 100, status: 'done', specialistName: '7M AI', deadlinePt: 'Concluído', deadlineEn: 'Done',
    checklist: [
      { txtPt: 'Conectar dados financeiros', txtEn: 'Connect financial data', done: true },
      { txtPt: 'Questionário de maturidade', txtEn: 'Maturity questionnaire', done: true },
      { txtPt: 'Cálculo do Growth Score', txtEn: 'Growth Score calculation', done: true },
      { txtPt: 'Relatório de diagnóstico', txtEn: 'Diagnosis report', done: true },
    ] },
  { n: 2, code: '7M2', verbPt: 'Qualificar', verbEn: 'Qualify', specialistRolePt: 'Contador', specialistRoleEn: 'Accountant', pct: 100, status: 'done', specialistName: 'Alexandre Nunes', deadlinePt: 'Concluído', deadlineEn: 'Done',
    checklist: [
      { txtPt: 'Revisão de enquadramento fiscal', txtEn: 'Tax framing review', done: true },
      { txtPt: 'Organização do plano de contas', txtEn: 'Chart of accounts setup', done: true },
      { txtPt: 'Conciliação dos últimos 12 meses', txtEn: '12-month reconciliation', done: true },
    ] },
  { n: 3, code: '7M3', verbPt: 'Organizar', verbEn: 'Organise', specialistRolePt: 'Administrativo', specialistRoleEn: 'Operations', pct: 70, status: 'doing', specialistName: 'Paloma Freitas', deadlinePt: 'faltam 12 dias', deadlineEn: '12 days left',
    checklist: [
      { txtPt: 'Fluxo de caixa semanal', txtEn: 'Weekly cash flow', done: true },
      { txtPt: 'Padrão de atendimento', txtEn: 'Service standard', done: true },
      { txtPt: 'Delegação de agenda', txtEn: 'Schedule delegation', done: false },
      { txtPt: 'Indicadores operacionais', txtEn: 'Operational indicators', done: false },
    ] },
  { n: 4, code: '7M4', verbPt: 'Crescer', verbEn: 'Grow', specialistRolePt: 'Marketing', specialistRoleEn: 'Marketing', pct: 0, status: 'next', specialistName: 'Brenda Correia', deadlinePt: 'pronto p/ iniciar', deadlineEn: 'ready to start',
    checklist: [
      { txtPt: 'Análise detalhada do público-alvo', txtEn: 'Detailed target-audience analysis', done: false },
      { txtPt: 'Mapa de canais de aquisição', txtEn: 'Acquisition channel map', done: false },
      { txtPt: 'Campanha de prospecção de leads', txtEn: 'Lead prospecting campaign', done: false },
      { txtPt: 'Funil e metas de conversão', txtEn: 'Funnel and conversion targets', done: false },
    ] },
  { n: 5, code: '7M5', verbPt: 'Capitalizar', verbEn: 'Capitalise', specialistRolePt: 'Gestor de Capital', specialistRoleEn: 'Capital Manager', pct: 0, status: 'locked', specialistName: 'Marcos Vidal', deadlinePt: 'bloqueado', deadlineEn: 'locked',
    checklist: [
      { txtPt: 'Dossiê de crédito', txtEn: 'Credit dossier', done: false },
      { txtPt: 'Análise de linhas disponíveis', txtEn: 'Available credit lines analysis', done: false },
      { txtPt: 'Estratégia de capital', txtEn: 'Capital strategy', done: false },
    ] },
  { n: 6, code: '7M6', verbPt: 'Escalar', verbEn: 'Scale', specialistRolePt: 'RH & Operações', specialistRoleEn: 'HR & Operations', pct: 0, status: 'locked', specialistName: 'Marcelo Reis', deadlinePt: 'bloqueado', deadlineEn: 'locked',
    checklist: [
      { txtPt: 'Manual de operações', txtEn: 'Operations manual', done: false },
      { txtPt: 'Estrutura de time', txtEn: 'Team structure', done: false },
      { txtPt: 'Playbook de expansão', txtEn: 'Expansion playbook', done: false },
    ] },
  { n: 7, code: '7M7', verbPt: 'Valorizar', verbEn: 'Value', specialistRolePt: 'Jurídico Tributário', specialistRoleEn: 'Tax & Legal', pct: 0, status: 'locked', specialistName: 'Alexandre Nunes', deadlinePt: 'bloqueado', deadlineEn: 'locked',
    checklist: [
      { txtPt: 'Governança e compliance', txtEn: 'Governance and compliance', done: false },
      { txtPt: 'Cálculo de valuation', txtEn: 'Valuation calculation', done: false },
      { txtPt: 'Preparação para due diligence', txtEn: 'Due-diligence preparation', done: false },
    ] },
];

export const STEP_OBJECTIVES: Record<number, Bi> = {
  1: { pt: 'Mapeamos toda a sua operação e calculamos seu Growth Score com base em princípios de análise de crédito bancário — saúde financeira, previsibilidade, risco e capacidade de crescer.', en: 'We mapped your whole operation and computed your Growth Score using bank credit-analysis principles — financial health, predictability, risk and capacity to grow.' },
  2: { pt: 'Regularizamos a estrutura fiscal e organizamos os dados contábeis para que toda decisão a partir daqui seja baseada em números confiáveis.', en: 'We regularised the tax structure and organised the accounting data so every decision from here is based on reliable numbers.' },
  3: { pt: 'Estruturamos os processos-chave e o controle de caixa. Faltam dois itens para você deixar de depender de si mesmo no dia a dia.', en: 'We are structuring the key processes and cash control. Two items remain so the business stops depending on you day to day.' },
  4: { pt: 'Aqui está o seu maior gargalo hoje. Vamos começar com uma análise detalhada do seu público e montar uma máquina de prospecção de leads previsível.', en: 'This is your biggest bottleneck today. We start with a detailed audience analysis and build a predictable lead-prospecting machine.' },
  5: { pt: 'Com receita previsível, estruturamos acesso a crédito e investimento nas melhores condições.', en: 'With predictable revenue, we structure access to credit and investment on the best terms.' },
  6: { pt: 'Transformamos o negócio em um sistema replicável — pronto para novas unidades ou franquia.', en: 'We turn the business into a replicable system — ready for new units or franchising.' },
  7: { pt: 'Preparamos governança e valuation para captação ou venda com o maior valor possível.', en: 'We prepare governance and valuation for fundraising or sale at the highest possible value.' },
};

export const MOCK_CARDS = [
  { icon: '◆', iconBg: 'rgba(201,154,46,.18)', value: '612', label: { pt: 'Growth Score', en: 'Growth Score' } as Bi, delta: { pt: 'Regular', en: 'Fair' } as Bi, deltaColor: '#F4D48A' },
  { icon: '€', iconBg: 'rgba(94,224,138,.16)', value: 'R$ 84,2k', label: { pt: 'Receita · mês', en: 'Revenue · month' } as Bi, delta: { pt: '+6%', en: '+6%' } as Bi, deltaColor: '#5ee08a' },
  { icon: '♟', iconBg: 'rgba(143,180,255,.16)', value: '312', label: { pt: 'Clientes ativos', en: 'Active customers' } as Bi, delta: { pt: '+4', en: '+4' } as Bi, deltaColor: '#5ee08a' },
  { icon: '▲', iconBg: 'rgba(201,154,46,.18)', value: { pt: '7M · Organizar', en: '7M · Organise' } as Bi, label: { pt: 'Etapa atual · 70%', en: 'Current step · 70%' } as Bi, delta: null, deltaColor: '#F4D48A' },
  { icon: '●', iconBg: 'rgba(143,180,255,.16)', value: 'Marcelo R.', label: { pt: 'Growth Manager · online', en: 'Growth Manager · online' } as Bi, delta: null, deltaColor: '#5ee08a' },
  { icon: '✦', iconBg: 'rgba(143,180,255,.16)', value: { pt: '3 insights', en: '3 insights' } as Bi, label: { pt: '7M AI · novos', en: '7M AI · new' } as Bi, delta: { pt: 'novo', en: 'new' } as Bi, deltaColor: '#8FB4FF' },
];

export const MOCK_CEO = [
  { n: '01', label: { pt: 'Saúde da empresa', en: 'Company health' } as Bi, value: '78/100', tag: { pt: 'Estável', en: 'Stable' } as Bi, tagColor: '#5ee08a', tagBg: 'rgba(94,224,138,.14)' },
  { n: '02', label: { pt: 'Crescimento', en: 'Growth' } as Bi, value: '+6%', tag: { pt: 'Desacelerando', en: 'Slowing' } as Bi, tagColor: '#C99A2E', tagBg: 'rgba(201,154,46,.14)' },
  { n: '03', label: { pt: 'Caixa', en: 'Cash runway' } as Bi, value: { pt: '41 dias', en: '41 days' } as Bi, tag: { pt: 'Atenção', en: 'Watch' } as Bi, tagColor: '#F4A24A', tagBg: 'rgba(244,162,74,.14)' },
  { n: '04', label: { pt: 'Oportunidades', en: 'Opportunities' } as Bi, value: '3', tag: { pt: 'Aguardando', en: 'Waiting' } as Bi, tagColor: '#8FB4FF', tagBg: 'rgba(143,180,255,.14)' },
  { n: '05', label: { pt: 'Próxima prioridade', en: 'Next priority' } as Bi, value: { pt: 'Prospecção', en: 'Prospecting' } as Bi, tag: { pt: 'Agir', en: 'Act now' } as Bi, tagColor: '#0B2149', tagBg: '#F4D48A' },
];

export const MOCK_TASKS: TaskDto[] = [
  { id: 't1', titlePt: 'Aprovar o mapa de público-alvo', titleEn: 'Approve the target-audience map', priority: 'high', prazoPt: 'Hoje', prazoEn: 'Today', tempo: '15 min', impactoPt: '+ Growth Score', impactoEn: '+ Growth Score', specialist: 'Marketing', done: false },
  { id: 't2', titlePt: 'Enviar faturamento do trimestre', titleEn: 'Send quarterly revenue data', priority: 'high', prazoPt: 'Amanhã', prazoEn: 'Tomorrow', tempo: '10 min', impactoPt: 'Capitalizar', impactoEn: 'Capitalise', specialist: 'Contador', done: false },
  { id: 't3', titlePt: 'Revisar script de conversão no WhatsApp', titleEn: 'Review WhatsApp conversion script', priority: 'medium', prazoPt: '2 dias', prazoEn: '2 days', tempo: '20 min', impactoPt: 'Vendas', impactoEn: 'Sales', specialist: 'Marketing', done: false },
  { id: 't4', titlePt: 'Delegar a agenda operacional', titleEn: 'Delegate the operations schedule', priority: 'medium', prazoPt: 'Esta semana', prazoEn: 'This week', tempo: '30 min', impactoPt: 'Gestão', impactoEn: 'Management', specialist: 'Operações', done: false },
  { id: 't5', titlePt: 'Concluir a conciliação contábil', titleEn: 'Finish accounting reconciliation', priority: 'medium', prazoPt: 'Concluído', prazoEn: 'Done', tempo: '', impactoPt: '', impactoEn: '', specialist: 'Contador', done: true },
];

export const MOCK_CHAT_INTRO: Bi = {
  pt: 'Olá! Sou a 7M AI, sua inteligência de crescimento. Já analisei o seu Growth Score, a sua receita e o seu Método 7M. Como posso ajudar hoje?',
  en: 'Hi! I am 7M AI, your growth intelligence. I have already analysed your Growth Score, your revenue and your 7M Method. How can I help today?',
};

export const MOCK_CHIPS = [
  { label: { pt: 'Analisar meu público', en: 'Analyse my audience' } as Bi, question: { pt: 'Analise meu público.', en: 'Analyse my audience.' } as Bi },
  { label: { pt: 'Por que meu Score é 612?', en: 'Why is my Score 612?' } as Bi, question: { pt: 'Por que meu Score é 612?', en: 'Why is my Score 612?' } as Bi },
  { label: { pt: 'Criar plano de prospecção', en: 'Build a prospecting plan' } as Bi, question: { pt: 'Crie um plano de prospecção.', en: 'Build a prospecting plan.' } as Bi },
];

export interface HubRow {
  icon: string;
  title: Bi;
  sub?: Bi;
  right?: Bi;
  rightColor?: string;
  rightBg?: string;
  iconBg?: string;
}
export interface HubSection {
  header: Bi;
  rows: HubRow[];
}
export interface HubScreen {
  key: string;
  icon: string;
  label: Bi;
  sub: Bi;
  title: Bi;
  sections: HubSection[];
}

export const MOCK_HUB_SCREENS: HubScreen[] = [
  {
    key: 'tarefas', icon: '✓', label: { pt: 'Tarefas', en: 'Tasks' }, sub: { pt: 'pendentes', en: 'open' },
    title: { pt: 'Tarefas', en: 'Tasks' }, sections: [],
  },
  {
    key: 'empresa', icon: '◈', label: { pt: 'Minha empresa', en: 'My company' }, sub: { pt: 'perfil & metas', en: 'profile & goals' },
    title: { pt: 'Minha empresa', en: 'My company' },
    sections: [
      { header: { pt: 'Cadastro', en: 'Profile' }, rows: [
        { icon: '◈', title: { pt: 'Perfil da empresa', en: 'Company profile' }, sub: { pt: 'Dados, marca, mercados', en: 'Data, brand, markets' }, right: { pt: 'Editar', en: 'Edit' }, rightColor: '#F4D48A' },
        { icon: '◉', title: { pt: 'Equipe', en: 'Team' }, sub: { pt: '4 membros', en: '4 members' }, right: { pt: 'Ver', en: 'See' }, rightColor: '#F4D48A' },
      ] },
      { header: { pt: 'Negócio', en: 'Business' }, rows: [
        { icon: '▦', title: { pt: 'Produtos & Serviços', en: 'Products & Services' }, sub: { pt: '3 linhas', en: '3 lines' } },
        { icon: '◍', title: { pt: 'Mercados & Segmentos', en: 'Markets & Segments' }, sub: { pt: 'Brasil · Europa', en: 'Brazil · Europe' } },
      ] },
      { header: { pt: 'Estratégia', en: 'Strategy' }, rows: [
        { icon: '◆', title: { pt: 'Objetivos & Metas', en: 'Goals & Targets' }, sub: { pt: 'Score 750 · dez/26', en: 'Score 750 · Dec/26' } },
        { icon: '▲', title: { pt: 'Indicadores', en: 'Indicators' }, sub: { pt: '6 KPIs monitorados', en: '6 KPIs tracked' } },
      ] },
    ],
  },
  {
    key: 'manager', icon: '●', label: { pt: 'Growth Manager', en: 'Growth Manager' }, sub: { pt: 'Marcelo R.', en: 'Marcelo R.' },
    title: { pt: 'Growth Manager', en: 'Growth Manager' },
    sections: [
      { header: { pt: 'Próxima reunião', en: 'Next meeting' }, rows: [
        { icon: '▦', title: { pt: 'Revisão do Método 7M', en: '7M Method review' }, sub: { pt: 'Ter 12 ago · 15:00 · Vídeo', en: 'Tue Aug 12 · 3pm · Video' }, right: { pt: 'Confirmada', en: 'Confirmed' }, rightColor: '#5ee08a', rightBg: 'rgba(94,224,138,.14)' },
      ] },
      { header: { pt: 'Arquivos', en: 'Files' }, rows: [
        { icon: '📄', title: { pt: 'Diagnóstico 7M.pdf', en: '7M Diagnosis.pdf' }, sub: { pt: '2,4 MB · há 3 dias', en: '2.4 MB · 3d ago' } },
        { icon: '📊', title: { pt: 'Plano de prospecção.xlsx', en: 'Prospecting plan.xlsx' }, sub: { pt: 'há 1 dia', en: '1d ago' } },
      ] },
      { header: { pt: 'Histórico', en: 'History' }, rows: [
        { icon: '◍', title: { pt: 'Ajuste do enquadramento fiscal', en: 'Tax framing adjustment' }, sub: { pt: 'Concluído · jul', en: 'Done · Jul' } },
        { icon: '◍', title: { pt: 'Meta de Score 750 definida', en: 'Score 750 goal set' }, sub: { pt: 'Concluído · jun', en: 'Done · Jun' } },
      ] },
    ],
  },
  {
    key: 'documentos', icon: '📄', label: { pt: 'Documentos', en: 'Documents' }, sub: { pt: 'central', en: 'hub' },
    title: { pt: 'Documentos', en: 'Documents' },
    sections: [
      { header: { pt: 'Diagnóstico', en: 'Diagnosis' }, rows: [
        { icon: '📄', title: { pt: 'Relatório de diagnóstico.pdf', en: 'Diagnosis report.pdf' }, sub: { pt: 'há 2 meses', en: '2mo ago' } },
        { icon: '📄', title: { pt: 'Growth Score inicial.pdf', en: 'Initial Growth Score.pdf' }, sub: { pt: 'há 2 meses', en: '2mo ago' } },
      ] },
      { header: { pt: 'Financeiro', en: 'Finance' }, rows: [
        { icon: '📊', title: { pt: 'Conciliação 12 meses.xlsx', en: '12-month reconciliation.xlsx' }, sub: { pt: 'há 1 mês', en: '1mo ago' } },
        { icon: '📄', title: { pt: 'Plano de contas.pdf', en: 'Chart of accounts.pdf' }, sub: { pt: 'há 1 mês', en: '1mo ago' } },
      ] },
      { header: { pt: 'Marketing', en: 'Marketing' }, rows: [
        { icon: '📝', title: { pt: 'Mapa de público (rascunho).doc', en: 'Audience map (draft).doc' }, sub: { pt: 'editando', en: 'editing' }, right: { pt: 'Novo', en: 'New' }, rightColor: '#8FB4FF', rightBg: 'rgba(143,180,255,.14)' },
      ] },
    ],
  },
  {
    key: 'oportunidades', icon: '◉', label: { pt: 'Oportunidades', en: 'Opportunities' }, sub: { pt: '3 novas', en: '3 new' },
    title: { pt: 'Oportunidades', en: 'Opportunities' },
    sections: [
      { header: { pt: 'Leads', en: 'Leads' }, rows: [
        { icon: '◉', title: { pt: '3 leads aguardando contato', en: '3 leads waiting for contact' }, sub: { pt: 'via campanha de prospecção', en: 'from prospecting campaign' }, right: { pt: '3', en: '3' }, rightColor: '#0B2149', rightBg: '#F4D48A' },
      ] },
      { header: { pt: 'Parcerias', en: 'Partnerships' }, rows: [
        { icon: '◍', title: { pt: 'Contador parceiro em Lisboa', en: 'Partner accountant in Lisbon' }, sub: { pt: 'para a expansão Europa', en: 'for Europe expansion' }, right: { pt: 'Novo', en: 'New' }, rightColor: '#8FB4FF', rightBg: 'rgba(143,180,255,.14)' },
      ] },
      { header: { pt: 'Editais & Eventos', en: 'Grants & Events' }, rows: [
        { icon: '▦', title: { pt: 'Edital de inovação PME', en: 'SME innovation grant' }, sub: { pt: 'inscrições até 30/09', en: 'apply by Sep 30' } },
        { icon: '◆', title: { pt: 'Rodada de negócios 7MARKET', en: '7MARKET business round' }, sub: { pt: '12 set · online', en: 'Sep 12 · online' } },
      ] },
    ],
  },
  {
    key: 'marketplace', icon: '▦', label: { pt: 'Marketplace', en: 'Marketplace' }, sub: { pt: 'comprar & vender', en: 'buy & sell' },
    title: { pt: 'Marketplace', en: 'Marketplace' },
    sections: [
      { header: { pt: 'Especialistas', en: 'Specialists' }, rows: [
        { icon: '●', title: { pt: 'Consultoria de tráfego pago', en: 'Paid traffic consulting' }, sub: { pt: '7MARKET Partners', en: '7MARKET Partners' }, right: { pt: 'R$ 1.200', en: 'R$ 1.200' }, rightColor: '#F4D48A' },
        { icon: '●', title: { pt: 'Mentoria de gestão', en: 'Management mentoring' }, sub: { pt: 'sob demanda', en: 'on demand' }, right: { pt: 'R$ 800', en: 'R$ 800' }, rightColor: '#F4D48A' },
      ] },
      { header: { pt: 'Ferramentas', en: 'Tools' }, rows: [
        { icon: '▦', title: { pt: 'CRM integrado 7M', en: '7M integrated CRM' }, sub: { pt: 'automação de leads', en: 'lead automation' }, right: { pt: 'Incluído', en: 'Included' }, rightColor: '#5ee08a', rightBg: 'rgba(94,224,138,.14)' },
      ] },
      { header: { pt: 'Cursos', en: 'Courses' }, rows: [
        { icon: '▶', title: { pt: 'Máquina de prospecção', en: 'Prospecting machine' }, sub: { pt: '6 aulas', en: '6 lessons' }, right: { pt: 'Grátis', en: 'Free' }, rightColor: '#8FB4FF', rightBg: 'rgba(143,180,255,.14)' },
      ] },
    ],
  },
  {
    key: 'circle', icon: '◍', label: { pt: 'Business Circle', en: 'Business Circle' }, sub: { pt: 'comunidade', en: 'community' },
    title: { pt: 'Business Circle', en: 'Business Circle' },
    sections: [
      { header: { pt: 'Eventos', en: 'Events' }, rows: [
        { icon: '▦', title: { pt: 'Encontro 7MARKET · São Paulo', en: '7MARKET meetup · São Paulo' }, sub: { pt: '28 ago · presencial', en: 'Aug 28 · in person' }, right: { pt: 'Vagas', en: 'Spots' }, rightColor: '#F4D48A' },
      ] },
      { header: { pt: 'Networking', en: 'Networking' }, rows: [
        { icon: '◉', title: { pt: '12 empresários no seu setor', en: '12 entrepreneurs in your sector' }, sub: { pt: 'conectar', en: 'connect' } },
        { icon: '◍', title: { pt: '3 indicações recebidas', en: '3 referrals received' }, sub: { pt: 'responder', en: 'reply' }, right: { pt: '3', en: '3' }, rightColor: '#0B2149', rightBg: '#F4D48A' },
      ] },
      { header: { pt: 'Rodadas', en: 'Rounds' }, rows: [
        { icon: '◆', title: { pt: 'Rodada de investidores', en: 'Investor round' }, sub: { pt: 'para a etapa Capitalizar', en: 'for the Capitalise step' }, right: { pt: 'Bloqueado', en: 'Locked' }, rightColor: '#6b82a6', rightBg: 'rgba(255,255,255,.05)' },
      ] },
    ],
  },
  {
    key: 'relatorios', icon: '▲', label: { pt: 'Relatórios', en: 'Reports' }, sub: { pt: 'mês · tri · ano', en: 'mo · qtr · yr' },
    title: { pt: 'Relatórios', en: 'Reports' },
    sections: [
      { header: { pt: 'Agosto 2026 · resumo', en: 'August 2026 · summary' }, rows: [
        { icon: '€', title: { pt: 'Receita', en: 'Revenue' }, sub: { pt: 'vs. jul +6%', en: 'vs Jul +6%' }, right: { pt: 'R$ 84,2k', en: 'R$ 84,2k' }, rightColor: '#F4D48A' },
        { icon: '◉', title: { pt: 'Clientes', en: 'Customers' }, sub: { pt: '+4 novos', en: '+4 new' }, right: { pt: '312', en: '312' }, rightColor: '#F4D48A' },
        { icon: '◆', title: { pt: 'Growth Score', en: 'Growth Score' }, sub: { pt: 'em evolução', en: 'improving' }, right: { pt: '612', en: '612' }, rightColor: '#F4D48A' },
      ] },
      { header: { pt: 'Atenção', en: 'Attention' }, rows: [
        { icon: '▲', title: { pt: 'Pendências', en: 'Open items' }, sub: { pt: '2 tarefas em atraso', en: '2 overdue tasks' }, right: { pt: '2', en: '2' }, rightColor: '#F4A24A', rightBg: 'rgba(244,162,74,.14)' },
        { icon: '★', title: { pt: 'Próximas ações', en: 'Next actions' }, sub: { pt: 'iniciar prospecção', en: 'start prospecting' }, right: { pt: 'Ver', en: 'See' }, rightColor: '#8FB4FF', rightBg: 'rgba(143,180,255,.14)' },
      ] },
    ],
  },
  {
    key: 'financeiro', icon: '€', label: { pt: 'Financeiro', en: 'Billing' }, sub: { pt: '7M Growth', en: '7M Growth' },
    title: { pt: 'Financeiro', en: 'Billing' },
    sections: [
      { header: { pt: 'Faturas', en: 'Invoices' }, rows: [
        { icon: '€', title: { pt: 'Agosto 2026', en: 'August 2026' }, sub: { pt: '7M Growth', en: '7M Growth' }, right: { pt: 'Pago', en: 'Paid' }, rightColor: '#5ee08a', rightBg: 'rgba(94,224,138,.14)' },
        { icon: '€', title: { pt: 'Julho 2026', en: 'July 2026' }, sub: { pt: '7M Growth', en: '7M Growth' }, right: { pt: 'Pago', en: 'Paid' }, rightColor: '#5ee08a', rightBg: 'rgba(94,224,138,.14)' },
      ] },
    ],
  },
  {
    key: 'notificacoes', icon: '🔔', label: { pt: 'Notificações', en: 'Notifications' }, sub: { pt: 'inteligentes', en: 'smart' },
    title: { pt: 'Notificações', en: 'Notifications' },
    sections: [
      { header: { pt: 'Hoje', en: 'Today' }, rows: [
        { icon: '★', title: { pt: 'Nova prioridade da 7M AI', en: 'New 7M AI priority' }, sub: { pt: 'prospecção de clientes', en: 'customer prospecting' }, right: { pt: 'agora', en: 'now' }, rightColor: '#8FB4FF' },
        { icon: '💬', title: { pt: 'Marcelo respondeu', en: 'Marcelo replied' }, sub: { pt: 'sobre o plano de prospecção', en: 'about the prospecting plan' }, right: { pt: '2h', en: '2h' } },
      ] },
      { header: { pt: 'Esta semana', en: 'This week' }, rows: [
        { icon: '◆', title: { pt: 'Seu Growth Score subiu', en: 'Your Growth Score rose' }, sub: { pt: '598 → 612', en: '598 → 612' }, right: { pt: '+14', en: '+14' }, rightColor: '#5ee08a' },
        { icon: '◆', title: { pt: 'Nova oportunidade', en: 'New opportunity' }, sub: { pt: 'edital de inovação PME', en: 'SME innovation grant' }, right: { pt: '1d', en: '1d' } },
      ] },
    ],
  },
  {
    key: 'config', icon: '⚙', label: { pt: 'Configurações', en: 'Settings' }, sub: { pt: 'conta', en: 'account' },
    title: { pt: 'Configurações', en: 'Settings' },
    sections: [
      { header: { pt: 'Empresa', en: 'Company' }, rows: [
        { icon: '◈', title: { pt: 'Dados da empresa', en: 'Company data' }, right: { pt: 'Editar', en: 'Edit' }, rightColor: '#F4D48A' },
        { icon: '◉', title: { pt: 'Equipe & permissões', en: 'Team & permissions' }, sub: { pt: '4 membros · RBAC', en: '4 members · RBAC' }, right: { pt: 'Gerir', en: 'Manage' }, rightColor: '#F4D48A' },
      ] },
      { header: { pt: 'Preferências', en: 'Preferences' }, rows: [
        { icon: '🌐', title: { pt: 'Idioma', en: 'Language' }, right: { pt: 'Trocar', en: 'Switch' }, rightColor: '#F4D48A' },
        { icon: '🔔', title: { pt: 'Notificações', en: 'Notifications' }, sub: { pt: 'inteligentes', en: 'smart' }, right: { pt: 'Ativo', en: 'On' }, rightColor: '#5ee08a', rightBg: 'rgba(94,224,138,.14)' },
      ] },
      { header: { pt: 'Integrações', en: 'Integrations' }, rows: [
        { icon: '◉', title: { pt: 'WhatsApp Business', en: 'WhatsApp Business' }, sub: { pt: 'não conectado', en: 'not connected' }, right: { pt: 'Conectar', en: 'Connect' }, rightColor: '#8FB4FF', rightBg: 'rgba(143,180,255,.14)' },
        { icon: '€', title: { pt: 'Stripe', en: 'Stripe' }, sub: { pt: 'pagamentos', en: 'payments' }, right: { pt: 'Conectado', en: 'Connected' }, rightColor: '#5ee08a', rightBg: 'rgba(94,224,138,.14)' },
      ] },
      { header: { pt: 'Segurança', en: 'Security' }, rows: [
        { icon: '🔒', title: { pt: 'Segurança & LGPD/GDPR', en: 'Security & GDPR' }, sub: { pt: '2FA ativo · criptografia', en: '2FA on · encryption' }, right: { pt: 'Ver', en: 'See' }, rightColor: '#F4D48A' },
        { icon: '◍', title: { pt: 'Logs & auditoria', en: 'Logs & audit' }, right: { pt: 'Ver', en: 'See' }, rightColor: '#F4D48A' },
      ] },
    ],
  },
];

export const MANAGER_HERO = {
  name: 'Marcelo Reis',
  role: { pt: 'Growth Manager · Estratégia & Finanças', en: 'Growth Manager · Strategy & Finance' } as Bi,
  status: { pt: 'online agora', en: 'online now' } as Bi,
  actions: [
    { icon: '💬', label: { pt: 'Chat', en: 'Chat' } as Bi },
    { icon: '▶', label: { pt: 'Vídeo', en: 'Video' } as Bi },
    { icon: '◉', label: { pt: 'WhatsApp', en: 'WhatsApp' } as Bi },
    { icon: '▦', label: { pt: 'Agenda', en: 'Calendar' } as Bi },
  ],
};

export const FINANCE_HERO = {
  label: { pt: 'Plano atual', en: 'Current plan' } as Bi,
  plan: '7M Growth',
  price: { pt: 'R$ 990 /mês', en: '$180 /mo' } as Bi,
  status: { pt: 'Ativo', en: 'Active' } as Bi,
  next: { pt: 'Próxima cobrança · 01 set', en: 'Next charge · Sep 1' } as Bi,
};

export const EMPRESA_HERO = {
  name: '7MARKET',
  sub: { pt: 'Growth Office · Global', en: 'Growth Office · Global' } as Bi,
  since: { pt: 'Cliente desde 2025', en: 'Client since 2025' } as Bi,
};
