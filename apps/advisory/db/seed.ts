import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { sql } from 'drizzle-orm';
import { db } from './client';
import {
  chapters,
  commissions,
  companies,
  give7Referrals,
  give7Types,
  marketplaceListings,
  marketplaceQa,
  methodProgress,
  methodSteps,
  plans,
  profiles,
  regions,
  seats,
  subscriptions,
  transactions,
  wizardLeads,
} from './schema';

/**
 * Seeds demo data for local development / staging.
 *
 * Auth users are created two different ways depending on environment:
 *  - Real Supabase project (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY set): uses the Auth Admin
 *    API (`auth.admin.createUser`), which is the only correct way to create a row in Supabase's
 *    managed `auth.users` table — the on_auth_user_created trigger then auto-creates the
 *    matching `profiles` row.
 *  - Local Postgres without real Supabase Auth (this repo's sandboxed dev loop, or a self-hosted
 *    stub): falls back to inserting into `auth.users` directly over the same DATABASE_URL
 *    connection, mirroring what Supabase Auth would have written. This path only works against
 *    a database that already has an `auth.users` table — never point it at a real Supabase
 *    project without the service role key.
 */

const DEMO_USERS = [
  { email: 'member@7madvisory.com', fullName: 'Padaria do Bairro', role: 'member' as const },
  { email: 'rep@7madvisory.com', fullName: 'Ana City Leader', role: 'rep' as const },
  { email: 'admin@7madvisory.com', fullName: 'Marcelo Santos', role: 'admin' as const },
];
const DEMO_PASSWORD = 'demo1234';

async function createAuthUsers(): Promise<Record<string, string>> {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const ids: Record<string, string> = {};

  if (url && serviceKey) {
    console.log('Creating demo users via Supabase Auth Admin API…');
    const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    for (const u of DEMO_USERS) {
      const { data, error } = await admin.auth.admin.createUser({
        email: u.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: u.fullName, role: u.role },
      });
      if (error && !error.message.includes('already been registered')) throw error;
      const id =
        data?.user?.id ??
        (await admin.auth.admin.listUsers()).data.users.find((x) => x.email === u.email)?.id;
      if (!id) throw new Error(`Could not resolve auth user id for ${u.email}`);
      ids[u.role] = id;
    }
    return ids;
  }

  console.log('SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY not set — inserting into auth.users directly (local dev only).');
  for (const u of DEMO_USERS) {
    const rows = await db.execute<{ id: string }>(sql`
      insert into auth.users (email, raw_user_meta_data)
      values (${u.email}, ${JSON.stringify({ full_name: u.fullName, role: u.role })}::jsonb)
      on conflict (email) do update set raw_user_meta_data = excluded.raw_user_meta_data
      returning id
    `);
    ids[u.role] = (rows as unknown as { id: string }[])[0].id;
  }
  return ids;
}

async function main() {
  console.log('Seeding reference data (method steps, plans, Give7 types)…');
  await db
    .insert(methodSteps)
    .values([
      { n: 1, verb: 'Diagnosticar', phase: 'Estruturar', specialistRole: 'Administrador de Empresas', description: 'Raio-x do negócio: público-alvo, capital de giro, precificação e concorrência. Entrega um plano estratégico de 12 meses.' },
      { n: 2, verb: 'Qualificar', phase: 'Estruturar', specialistRole: 'Administrador de Empresas', description: 'Capacitação do dono e da equipe em gestão e processos — para o negócio rodar sem depender 60h/semana do fundador.' },
      { n: 3, verb: 'Organizar', phase: 'Estruturar', specialistRole: 'Contador', description: 'Fluxo de caixa, formalização e balanços organizados. Pré-requisito para acesso a crédito com credibilidade.' },
      { n: 4, verb: 'Crescer', phase: 'Crescer', specialistRole: 'Growth & Marketing Specialist', description: 'Marketing digital completo: posicionamento, tráfego pago, redes sociais e funil de vendas. O motor da receita.' },
      { n: 5, verb: 'Capitalizar', phase: 'Crescer', specialistRole: 'Financial Advisor', description: 'Com a casa organizada, estruturamos o acesso a crédito e capital nas melhores condições e o uso planejado.' },
      { n: 6, verb: 'Escalar', phase: 'Escalar', specialistRole: 'Operations & Scale Specialist', description: 'Escala e expansão: padronização, filiais, franquia e novos canais. Um negócio que se replica.' },
      { n: 7, verb: 'Valorizar', phase: 'Topo', specialistRole: 'Esp. Investimentos', description: 'Valuation e patrimônio: a empresa vira ativo que se vende, atrai sócio e capta investimento. Governança e saída.' },
    ])
    .onConflictDoNothing();

  await db
    .insert(plans)
    .values([
      { code: '7M0', name: 'Entrada', scaleLabel: 'MEI / micro', priceCents: 49700, commissionPct: '0' },
      { code: '7M1', name: 'Empreendedor', scaleLabel: '1 CNPJ', priceCents: 100000, commissionPct: '1' },
      { code: '7M2', name: 'Núcleo', scaleLabel: 'até 12 empresas', priceCents: 200000, commissionPct: '2' },
      { code: '7M3', name: 'Capítulo', scaleLabel: 'até 40 empresas', priceCents: 300000, commissionPct: '3' },
      { code: '7M4', name: 'Região', scaleLabel: 'multi-capítulo', priceCents: 400000, commissionPct: '4' },
      { code: '7M5', name: 'Hub Estadual', scaleLabel: 'estado', priceCents: 500000, commissionPct: '5' },
      { code: '7M6', name: 'Rede Nacional', scaleLabel: 'país', priceCents: 600000, commissionPct: '6' },
      { code: '7M7', name: 'Rede Global', scaleLabel: 'global', priceCents: 700000, commissionPct: '7' },
    ])
    .onConflictDoNothing();

  await db
    .insert(give7Types)
    .values([
      { n: 1, title: 'Referência', description: 'Indique um cliente para outro membro' },
      { n: 2, title: 'Conexão', description: 'Apresente duas pessoas que devem se conhecer' },
      { n: 3, title: 'Conhecimento', description: 'Compartilhe uma expertise ou aula' },
      { n: 4, title: 'Cliente', description: 'Traga uma oportunidade de venda' },
      { n: 5, title: 'Parceiro', description: 'Indique um fornecedor ou parceiro' },
      { n: 6, title: 'Oportunidade', description: 'Sinalize um edital, evento ou abertura' },
      { n: 7, title: 'Inteligência', description: 'Traga um dado ou insight de mercado' },
    ])
    .onConflictDoNothing();

  const userIds = await createAuthUsers();

  console.log('Upserting profile roles (in case the auth trigger already ran with defaults)…');
  for (const u of DEMO_USERS) {
    await db
      .update(profiles)
      .set({ role: u.role, fullName: u.fullName })
      .where(sql`id = ${userIds[u.role]}`);
  }

  console.log('Seeding région/chapter/seat (Praça piloto BH)…');
  const [region] = await db
    .insert(regions)
    .values({ name: 'Belo Horizonte', state: 'MG', status: 'pilot', cityLeaderProfileId: userIds.rep })
    .returning();

  const [chapter] = await db
    .insert(chapters)
    .values({ regionId: region.id, name: 'Capítulo Centro', meetingFrequency: 'biweekly' })
    .returning();

  await db.insert(seats).values([
    { chapterId: chapter.id, sector: 'Alimentação', status: 'available' },
    { chapterId: chapter.id, sector: 'Autopeças', status: 'available' },
    { chapterId: chapter.id, sector: 'Beleza', status: 'available' },
  ]);

  console.log('Seeding demo Member company + method progress…');
  const [company] = await db
    .insert(companies)
    .values({
      ownerProfileId: userIds.member,
      legalName: 'Padaria do Bairro LTDA',
      tradeName: 'Padaria do Bairro',
      cnpj: '12345678000190',
      sector: 'Alimentação',
      regionId: region.id,
      chapterId: chapter.id,
      planCode: '7M2',
      verified: true,
      verifiedAt: new Date(),
    })
    .returning();

  await db
    .update(seats)
    .set({ companyId: company.id, status: 'occupied' })
    .where(sql`chapter_id = ${chapter.id} and sector = 'Alimentação'`);

  await db.insert(methodProgress).values([
    { companyId: company.id, stepN: 1, status: 'done', pct: 100, startedAt: new Date(), completedAt: new Date() },
    { companyId: company.id, stepN: 2, status: 'doing', pct: 60, startedAt: new Date() },
    { companyId: company.id, stepN: 3, status: 'next', pct: 0 },
    { companyId: company.id, stepN: 4, status: 'locked', pct: 0 },
    { companyId: company.id, stepN: 5, status: 'locked', pct: 0 },
    { companyId: company.id, stepN: 6, status: 'locked', pct: 0 },
    { companyId: company.id, stepN: 7, status: 'locked', pct: 0 },
  ]);

  console.log('Seeding subscription (incomplete — real values come from Stripe once configured)…');
  await db.insert(subscriptions).values({ companyId: company.id, planCode: '7M2', status: 'incomplete' });

  console.log('Seeding marketplace listing…');
  const [listing] = await db
    .insert(marketplaceListings)
    .values({
      companyId: company.id,
      type: 'offer',
      category: 'product',
      title: 'Fornada artesanal — atacado',
      description: 'Pães e salgados congelados para revenda. Produção diária, entrega própria.',
      priceLabel: 'R$ 4,50/un',
      location: 'BH · MG',
      status: 'active',
    })
    .returning();

  await db.insert(marketplaceQa).values([
    { listingId: listing.id, question: 'Faz entrega?', answer: 'Sim, raio de 20km sem custo acima de 200 un.', sortOrder: 0 },
    { listingId: listing.id, question: 'Tem permuta?', answer: 'Aceito permuta parcial com insumos.', sortOrder: 1 },
  ]);

  console.log('Seeding a completed transaction + commission…');
  const [tx] = await db
    .insert(transactions)
    .values({
      listingId: listing.id,
      originCompanyId: company.id,
      description: 'Fornada atacado — 3.000un',
      amount: '13500.00',
      status: 'confirmed',
      confirmedAt: new Date(),
    })
    .returning();

  await db.insert(commissions).values([
    { transactionId: tx.id, type: 'direct', beneficiaryProfileId: userIds.rep, ratePct: '2.00', amount: '270.00' },
  ]);

  console.log('Seeding a Give7 referral…');
  await db.insert(give7Referrals).values({
    originCompanyId: company.id,
    typeN: 1,
    description: 'Indiquei um cliente de bolos para a Bella Estética',
    status: 'sent',
  });

  console.log('Seeding a wizard lead (pre-signup funnel)…');
  await db.insert(wizardLeads).values({
    name: 'Rafael Sócio',
    email: 'rafael@mototech.example.com',
    sector: 'Autopeças',
    companyAge: '3 a 10 anos',
    revenueRange: 'R$ 20–100 mil',
    challenge: 'growth',
    suggestedPlan: '7M3',
    suggestedStep: 4,
    suggestedSpecialist: 'Growth & Marketing Specialist',
  });

  console.log('\nDone. Demo logins (password: demo1234):');
  console.log('  member -> member@7madvisory.com');
  console.log('  rep    -> rep@7madvisory.com');
  console.log('  admin  -> admin@7madvisory.com');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
