import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const METHOD_STEPS = [
  { n: 1, code: '7M1', verbPt: 'Diagnosticar', verbEn: 'Diagnose', specialistRolePt: '7M AI · Growth Analyst', specialistRoleEn: '7M AI · Growth Analyst' },
  { n: 2, code: '7M2', verbPt: 'Qualificar', verbEn: 'Qualify', specialistRolePt: 'Contador', specialistRoleEn: 'Accountant' },
  { n: 3, code: '7M3', verbPt: 'Organizar', verbEn: 'Organise', specialistRolePt: 'Administrativo', specialistRoleEn: 'Operations' },
  { n: 4, code: '7M4', verbPt: 'Crescer', verbEn: 'Grow', specialistRolePt: 'Marketing', specialistRoleEn: 'Marketing' },
  { n: 5, code: '7M5', verbPt: 'Capitalizar', verbEn: 'Capitalise', specialistRolePt: 'Gestor de Capital', specialistRoleEn: 'Capital Manager' },
  { n: 6, code: '7M6', verbPt: 'Escalar', verbEn: 'Scale', specialistRolePt: 'RH & Operações', specialistRoleEn: 'HR & Operations' },
  { n: 7, code: '7M7', verbPt: 'Valorizar', verbEn: 'Value', specialistRolePt: 'Jurídico Tributário', specialistRoleEn: 'Tax & Legal' },
];

const STEP_PROGRESS = [
  { n: 1, pct: 100, status: 'done' as const, specialistName: '7M AI', deadlinePt: 'Concluído', deadlineEn: 'Done',
    checklist: [
      { txtPt: 'Conectar dados financeiros', txtEn: 'Connect financial data', done: true },
      { txtPt: 'Questionário de maturidade', txtEn: 'Maturity questionnaire', done: true },
      { txtPt: 'Cálculo do Growth Score', txtEn: 'Growth Score calculation', done: true },
      { txtPt: 'Relatório de diagnóstico', txtEn: 'Diagnosis report', done: true },
    ] },
  { n: 2, pct: 100, status: 'done' as const, specialistName: 'Alexandre Nunes', deadlinePt: 'Concluído', deadlineEn: 'Done',
    checklist: [
      { txtPt: 'Revisão de enquadramento fiscal', txtEn: 'Tax framing review', done: true },
      { txtPt: 'Organização do plano de contas', txtEn: 'Chart of accounts setup', done: true },
      { txtPt: 'Conciliação dos últimos 12 meses', txtEn: '12-month reconciliation', done: true },
    ] },
  { n: 3, pct: 70, status: 'doing' as const, specialistName: 'Paloma Freitas', deadlinePt: 'faltam 12 dias', deadlineEn: '12 days left',
    checklist: [
      { txtPt: 'Fluxo de caixa semanal', txtEn: 'Weekly cash flow', done: true },
      { txtPt: 'Padrão de atendimento', txtEn: 'Service standard', done: true },
      { txtPt: 'Delegação de agenda', txtEn: 'Schedule delegation', done: false },
      { txtPt: 'Indicadores operacionais', txtEn: 'Operational indicators', done: false },
    ] },
  { n: 4, pct: 0, status: 'next' as const, specialistName: 'Brenda Correia', deadlinePt: 'pronto p/ iniciar', deadlineEn: 'ready to start',
    checklist: [
      { txtPt: 'Análise detalhada do público-alvo', txtEn: 'Detailed target-audience analysis', done: false },
      { txtPt: 'Mapa de canais de aquisição', txtEn: 'Acquisition channel map', done: false },
      { txtPt: 'Campanha de prospecção de leads', txtEn: 'Lead prospecting campaign', done: false },
      { txtPt: 'Funil e metas de conversão', txtEn: 'Funnel and conversion targets', done: false },
    ] },
  { n: 5, pct: 0, status: 'locked' as const, specialistName: 'Marcos Vidal', deadlinePt: 'bloqueado', deadlineEn: 'locked',
    checklist: [
      { txtPt: 'Dossiê de crédito', txtEn: 'Credit dossier', done: false },
      { txtPt: 'Análise de linhas disponíveis', txtEn: 'Available credit lines analysis', done: false },
      { txtPt: 'Estratégia de capital', txtEn: 'Capital strategy', done: false },
    ] },
  { n: 6, pct: 0, status: 'locked' as const, specialistName: 'Marcelo Reis', deadlinePt: 'bloqueado', deadlineEn: 'locked',
    checklist: [
      { txtPt: 'Manual de operações', txtEn: 'Operations manual', done: false },
      { txtPt: 'Estrutura de time', txtEn: 'Team structure', done: false },
      { txtPt: 'Playbook de expansão', txtEn: 'Expansion playbook', done: false },
    ] },
  { n: 7, pct: 0, status: 'locked' as const, specialistName: 'Alexandre Nunes', deadlinePt: 'bloqueado', deadlineEn: 'locked',
    checklist: [
      { txtPt: 'Governança e compliance', txtEn: 'Governance and compliance', done: false },
      { txtPt: 'Cálculo de valuation', txtEn: 'Valuation calculation', done: false },
      { txtPt: 'Preparação para due diligence', txtEn: 'Due-diligence preparation', done: false },
    ] },
];

const TASKS = [
  { titlePt: 'Aprovar o mapa de público-alvo', titleEn: 'Approve the target-audience map', priority: 'high' as const, prazoPt: 'Hoje', prazoEn: 'Today', tempo: '15 min', impactoPt: '+ Growth Score', impactoEn: '+ Growth Score', specialist: 'Marketing', done: false },
  { titlePt: 'Enviar faturamento do trimestre', titleEn: 'Send quarterly revenue data', priority: 'high' as const, prazoPt: 'Amanhã', prazoEn: 'Tomorrow', tempo: '10 min', impactoPt: 'Capitalizar', impactoEn: 'Capitalise', specialist: 'Contador', done: false },
  { titlePt: 'Revisar script de conversão no WhatsApp', titleEn: 'Review WhatsApp conversion script', priority: 'medium' as const, prazoPt: '2 dias', prazoEn: '2 days', tempo: '20 min', impactoPt: 'Vendas', impactoEn: 'Sales', specialist: 'Marketing', done: false },
  { titlePt: 'Delegar a agenda operacional', titleEn: 'Delegate the operations schedule', priority: 'medium' as const, prazoPt: 'Esta semana', prazoEn: 'This week', tempo: '30 min', impactoPt: 'Gestão', impactoEn: 'Management', specialist: 'Operações', done: false },
  { titlePt: 'Concluir a conciliação contábil', titleEn: 'Finish accounting reconciliation', priority: 'medium' as const, prazoPt: 'Concluído', prazoEn: 'Done', tempo: '', impactoPt: '', impactoEn: '', specialist: 'Contador', done: true },
];

async function main() {
  console.log('Seeding method steps…');
  for (const step of METHOD_STEPS) {
    await prisma.methodStep.upsert({ where: { n: step.n }, update: step, create: step });
  }

  console.log('Seeding users (admin, rep chain, demo client)…');
  const passwordHash = await bcrypt.hash('demo1234', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@7market.com' },
    update: {},
    create: { email: 'admin@7market.com', passwordHash, role: 'admin', name: 'Sede 7MARKET' },
  });

  // Upline chain: repTop (7M7) -> repMid (7M4) -> repBase (7M2, brought the client)
  const repTopUser = await prisma.user.upsert({
    where: { email: 'rep.top@7market.com' },
    update: {},
    create: { email: 'rep.top@7market.com', passwordHash, role: 'rep', name: 'Ricardo Salles' },
  });
  const repTop = await prisma.rep.upsert({
    where: { userId: repTopUser.id },
    update: {},
    create: { userId: repTopUser.id, nivel: 7, faixaFaturamento: 'Internacional', city: 'Lisboa' },
  });

  const repMidUser = await prisma.user.upsert({
    where: { email: 'rep.mid@7market.com' },
    update: {},
    create: { email: 'rep.mid@7market.com', passwordHash, role: 'rep', name: 'Marcelo Reis' },
  });
  const repMid = await prisma.rep.upsert({
    where: { userId: repMidUser.id },
    update: { uplineRepId: repTop.id },
    create: { userId: repMidUser.id, nivel: 4, faixaFaturamento: 'Nacional', city: 'São Paulo', uplineRepId: repTop.id },
  });

  const repBaseUser = await prisma.user.upsert({
    where: { email: 'rep.base@7market.com' },
    update: {},
    create: { email: 'rep.base@7market.com', passwordHash, role: 'rep', name: 'Brenda Correia' },
  });
  const repBase = await prisma.rep.upsert({
    where: { userId: repBaseUser.id },
    update: { uplineRepId: repMid.id },
    create: { userId: repBaseUser.id, nivel: 2, faixaFaturamento: 'Regional', city: 'Curitiba', uplineRepId: repMid.id },
  });

  const clientUser = await prisma.user.upsert({
    where: { email: 'demo@7market.com' },
    update: {},
    create: { email: 'demo@7market.com', passwordHash, role: 'client', name: 'Empreendedor Demo' },
  });

  console.log('Seeding company + diagnostic + method progress…');
  let company = await prisma.company.findFirst({ where: { ownerUserId: clientUser.id } });
  if (!company) {
    company = await prisma.company.create({
      data: {
        ownerUserId: clientUser.id,
        cnpj: '00.000.000/0001-00',
        nome: '7MARKET',
        setor: 'Growth Office',
        moeda: 'BRL',
        growthScore: 612,
        nivel7m: 3,
        faturamentoAnual: 1010400,
      },
    });
  }

  await prisma.diagnostic.create({
    data: {
      companyId: company.id,
      gargalo: 'falta de clientes novos',
      respostas: { saude_financeira: 8, previsibilidade_receita: 7, risco_operacional: 6, capacidade_crescimento: 5, governanca: 4 },
      growthScore: 612,
      status: 'complete',
    },
  });

  for (const p of STEP_PROGRESS) {
    await prisma.companyStepProgress.upsert({
      where: { companyId_stepN: { companyId: company.id, stepN: p.n } },
      update: p,
      create: { ...p, companyId: company.id, stepN: p.n },
    });
  }

  await prisma.membership.upsert({
    where: { companyId_repId: { companyId: company.id, repId: repBase.id } },
    update: {},
    create: { companyId: company.id, repId: repBase.id },
  });

  console.log('Seeding subscription + override commissions…');
  let subscription = await prisma.subscription.findFirst({ where: { companyId: company.id } });
  if (!subscription) {
    subscription = await prisma.subscription.create({
      data: { companyId: company.id, plano: '7M Growth', valorMensal: 990, status: 'active' },
    });
  }

  const mesReferencia = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const chain = [repBase, repMid, repTop]; // base first, walking upline
  let cumulative = 0;
  const MAX_OVERRIDE_PCT = 28;
  for (const rep of chain) {
    if (cumulative >= MAX_OVERRIDE_PCT) break;
    const pct = Math.min(rep.nivel, MAX_OVERRIDE_PCT - cumulative);
    if (pct <= 0) break;
    cumulative += pct;
    const valor = Number(subscription.valorMensal) * (pct / 100);
    await prisma.commission.upsert({
      where: { subscriptionId_repId_mesReferencia: { subscriptionId: subscription.id, repId: rep.id, mesReferencia } },
      update: { pct, valor },
      create: { subscriptionId: subscription.id, repId: rep.id, nivel: rep.nivel, pct, valor, mesReferencia },
    });
  }

  console.log('Seeding tasks…');
  const existingTasks = await prisma.task.count({ where: { companyId: company.id } });
  if (existingTasks === 0) {
    await prisma.task.createMany({ data: TASKS.map((t) => ({ ...t, companyId: company.id })) });
  }

  console.log('Seeding demo event + 7M AI agent…');
  await prisma.event.upsert({
    where: { id: 'seed-event-comunit' },
    update: {},
    create: {
      id: 'seed-event-comunit',
      repId: repBase.id,
      tipo: 'comunit',
      data: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      faixa: 'Regional',
      status: 'scheduled',
    },
  });

  const agent = await prisma.agent.upsert({
    where: { key: '7m-ai' },
    update: {},
    create: { key: '7m-ai', name: '7M AI', description: 'Growth intelligence chat agent' },
  });
  const existingRun = await prisma.agentRun.findFirst({ where: { companyId: company.id } });
  if (!existingRun) {
    await prisma.agentRun.create({
      data: {
        agentId: agent.id,
        companyId: company.id,
        userId: clientUser.id,
        input: { message: 'Olá! Sou a 7M AI, sua inteligência de crescimento.' },
        output: { reply: 'Já analisei o seu Growth Score, a sua receita e o seu Método 7M. Como posso ajudar hoje?' },
        riskLevel: 'low',
        status: 'completed',
        completedAt: new Date(),
      },
    });
  }

  console.log('Done. Demo logins (password: demo1234):');
  console.log(`  client → ${clientUser.email}`);
  console.log(`  rep    → ${repBaseUser.email}`);
  console.log(`  admin  → ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
