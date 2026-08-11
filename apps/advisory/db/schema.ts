import {
  pgSchema,
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

/**
 * 7M Advisory — data model.
 *
 * Source of truth: design_handoff_7m_advisory/README.md (tokens, roles, Método 7M1-7M7,
 * plan table) and 7MARKET - Arquitetura.dc.html (Praça → Capítulo → Member → Seat hierarchy,
 * revenue streams, 4 access roles). Table/column names are English per this monorepo's existing
 * convention (apps/api's Prisma schema); brand-specific nouns (Seat, Give7, Verified) are kept
 * recognizable rather than translated into generic synonyms.
 *
 * Tenant isolation is enforced by RLS (see db/migrations/*_rls.sql), not just by these FKs —
 * every table a Member can reach is scoped to their own `companies` row, every table a Rep can
 * reach is scoped to their own `regions` row, via auth.uid() lookups through `profiles`.
 */

// Supabase owns the `auth` schema; this is a typed reference to auth.users for FKs only —
// we never create/alter that table ourselves.
const authSchema = pgSchema('auth');
export const authUsers = authSchema.table('users', {
  id: uuid('id').primaryKey(),
});

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const roleEnum = pgEnum('role', ['member', 'rep', 'admin']);
export const planCodeEnum = pgEnum('plan_code', ['7M0', '7M1', '7M2', '7M3', '7M4', '7M5', '7M6', '7M7']);
export const regionStatusEnum = pgEnum('region_status', ['pilot', 'active', 'planned']);
export const chapterFrequencyEnum = pgEnum('chapter_frequency', ['weekly', 'biweekly', 'monthly']);
export const seatStatusEnum = pgEnum('seat_status', ['available', 'occupied', 'waitlist']);
export const wizardStatusEnum = pgEnum('wizard_status', ['lead', 'converted']);
export const methodStepStatusEnum = pgEnum('method_step_status', ['locked', 'next', 'doing', 'done']);
export const listingTypeEnum = pgEnum('listing_type', ['offer', 'intent']);
export const listingCategoryEnum = pgEnum('listing_category', ['product', 'service', 'equipment']);
export const listingStatusEnum = pgEnum('listing_status', ['active', 'paused', 'removed', 'pending_review']);
export const transactionStatusEnum = pgEnum('transaction_status', ['pending', 'confirmed', 'canceled']);
export const commissionTypeEnum = pgEnum('commission_type', ['direct', 'network']);
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'trialing',
  'active',
  'past_due',
  'canceled',
  'incomplete',
]);
export const verificationStatusEnum = pgEnum('verification_status', ['pending', 'approved', 'rejected']);
export const give7StatusEnum = pgEnum('give7_status', ['sent', 'received', 'converted']);

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

/** 1:1 with auth.users. `role` + tenant FKs below are what RLS policies key off. */
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().references(() => authUsers.id, { onDelete: 'cascade' }),
  role: roleEnum('role').notNull().default('member'),
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  // Rep hierarchy — a Rep can recruit sub-leaders ("7M Comunit") below them; commission
  // overrides stack up this chain, same pattern as the 7MARKET Growth Office CommissionService.
  uplineRepId: uuid('upline_rep_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Geography / community — Camada 1 "Rede" (Praça → Capítulo → Seat)
// ---------------------------------------------------------------------------

/** "Praça" — the city/region. The unit that replicates; one City Leader (Rep) per region. */
export const regions = pgTable('regions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  state: text('state'),
  country: text('country').notNull().default('Brasil'),
  cityLeaderProfileId: uuid('city_leader_profile_id').references(() => profiles.id),
  status: regionStatusEnum('status').notNull().default('planned'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/** "Capítulo" — recurring chapter inside a region; governs Seat exclusivity, hosts the Round. */
export const chapters = pgTable('chapters', {
  id: uuid('id').primaryKey().defaultRandom(),
  regionId: uuid('region_id')
    .notNull()
    .references(() => regions.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  meetingFrequency: chapterFrequencyEnum('meeting_frequency').notNull().default('biweekly'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/** "7M Seat" — one exclusive sector chair per chapter. Scarcity that becomes premium price. */
export const seats = pgTable(
  'seats',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    chapterId: uuid('chapter_id')
      .notNull()
      .references(() => chapters.id, { onDelete: 'cascade' }),
    sector: text('sector').notNull(),
    companyId: uuid('company_id').references(() => companies.id),
    status: seatStatusEnum('status').notNull().default('available'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    oneSectorPerChapter: unique('seats_chapter_sector_unique').on(t.chapterId, t.sector),
  }),
);

/** Waitlist for an occupied Seat — the "lista de espera por setor" the architecture doc flags. */
export const seatWaitlist = pgTable('seat_waitlist', {
  id: uuid('id').primaryKey().defaultRandom(),
  seatId: uuid('seat_id')
    .notNull()
    .references(() => seats.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Companies — the Member tenant
// ---------------------------------------------------------------------------

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerProfileId: uuid('owner_profile_id')
    .notNull()
    .unique()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  legalName: text('legal_name').notNull(),
  tradeName: text('trade_name'),
  cnpj: text('cnpj').unique(),
  sector: text('sector'),
  regionId: uuid('region_id').references(() => regions.id),
  chapterId: uuid('chapter_id').references(() => chapters.id),
  planCode: planCodeEnum('plan_code').notNull().default('7M0'),
  verified: boolean('verified').notNull().default(false),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/** "7M Verified" audit trail — pre-requisite for a Seat, marketplace badge, and 7M Capital. */
export const verifications = pgTable('verifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade' }),
  status: verificationStatusEnum('status').notNull().default('pending'),
  documentPath: text('document_path'), // Supabase Storage object path
  reviewedByProfileId: uuid('reviewed_by_profile_id').references(() => profiles.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
});

// ---------------------------------------------------------------------------
// Wizard (funil de convicção) — Camada 2 "Método", entry point
// ---------------------------------------------------------------------------

export const wizardLeads = pgTable('wizard_leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => companies.id), // set once the lead converts
  name: text('name').notNull(),
  email: text('email').notNull(),
  sector: text('sector'),
  companyAge: text('company_age'), // "Menos de 1 ano" … "Mais de 10 anos"
  revenueRange: text('revenue_range'), // "Até R$ 20 mil/mês" … "Acima de R$ 500 mil"
  challenge: text('challenge').notNull(), // growth | finance | owner | capital | scale | legacy
  suggestedPlan: planCodeEnum('suggested_plan').notNull(),
  suggestedStep: integer('suggested_step').notNull(),
  suggestedSpecialist: text('suggested_specialist').notNull(),
  scheduledDay: text('scheduled_day'),
  scheduledSlot: text('scheduled_slot'),
  scheduledFormat: text('scheduled_format'),
  status: wizardStatusEnum('status').notNull().default('lead'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Método 7M esteira — Camada 2 "Método"
// ---------------------------------------------------------------------------

/** Static reference: the 7 steps. Seeded once, edited only by Admin. */
export const methodSteps = pgTable('method_steps', {
  n: integer('n').primaryKey(), // 1..7
  verb: text('verb').notNull(), // Diagnosticar, Qualificar, …
  phase: text('phase').notNull(), // Estruturar | Crescer | Escalar | Topo
  specialistRole: text('specialist_role').notNull(),
  description: text('description').notNull(),
});

/** Per-company progress through the 7 steps. One row per (company, step). */
export const methodProgress = pgTable(
  'method_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    stepN: integer('step_n')
      .notNull()
      .references(() => methodSteps.n),
    status: methodStepStatusEnum('status').notNull().default('locked'),
    pct: integer('pct').notNull().default(0),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ oneRowPerStep: unique('method_progress_company_step_unique').on(t.companyId, t.stepN) }),
);

// ---------------------------------------------------------------------------
// Marketplace — Camada 3 "Capital & Deals"
// ---------------------------------------------------------------------------

export const marketplaceListings = pgTable('marketplace_listings', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade' }),
  type: listingTypeEnum('type').notNull().default('offer'),
  category: listingCategoryEnum('category').notNull().default('product'),
  title: text('title').notNull(),
  description: text('description').notNull(),
  priceLabel: text('price_label'), // free-text per design ("R$ 4,50/un", "sob consulta")
  location: text('location'),
  status: listingStatusEnum('status').notNull().default('pending_review'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const marketplaceQa = pgTable('marketplace_qa', {
  id: uuid('id').primaryKey().defaultRandom(),
  listingId: uuid('listing_id')
    .notNull()
    .references(() => marketplaceListings.id, { onDelete: 'cascade' }),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const marketplaceInterests = pgTable('marketplace_interests', {
  id: uuid('id').primaryKey().defaultRandom(),
  listingId: uuid('listing_id')
    .notNull()
    .references(() => marketplaceListings.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade' }),
  message: text('message'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Transactions + commissions
// ---------------------------------------------------------------------------

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  listingId: uuid('listing_id').references(() => marketplaceListings.id),
  originCompanyId: uuid('origin_company_id').references(() => companies.id),
  destinationCompanyId: uuid('destination_company_id').references(() => companies.id),
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  status: transactionStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
});

/**
 * One row per commission stakeholder on a transaction. `direct` = the origin company's own
 * plan-level rate (1%-7%); `network` = a stacked override for an upline Rep, mirroring the
 * 7MARKET Growth Office CommissionService's walk-the-upline-chain pattern via profiles.uplineRepId.
 */
export const commissions = pgTable('commissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  transactionId: uuid('transaction_id')
    .notNull()
    .references(() => transactions.id, { onDelete: 'cascade' }),
  type: commissionTypeEnum('type').notNull().default('direct'),
  beneficiaryProfileId: uuid('beneficiary_profile_id').references(() => profiles.id),
  ratePct: numeric('rate_pct', { precision: 5, scale: 2 }).notNull(),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Plans + subscriptions (Stripe-backed MRR)
// ---------------------------------------------------------------------------

export const plans = pgTable('plans', {
  code: planCodeEnum('code').primaryKey(),
  name: text('name').notNull(),
  scaleLabel: text('scale_label').notNull(),
  priceCents: integer('price_cents').notNull(),
  commissionPct: numeric('commission_pct', { precision: 5, scale: 2 }).notNull(),
  stripePriceId: text('stripe_price_id'),
});

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id')
    .notNull()
    .unique()
    .references(() => companies.id, { onDelete: 'cascade' }),
  planCode: planCodeEnum('plan_code')
    .notNull()
    .references(() => plans.code),
  status: subscriptionStatusEnum('status').notNull().default('incomplete'),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Give7 — the 7 indication types members exchange inside the network
// ---------------------------------------------------------------------------

export const give7Types = pgTable('give7_types', {
  n: integer('n').primaryKey(), // 1..7
  title: text('title').notNull(), // Referência, Conexão, Conhecimento, Cliente, Parceiro, Oportunidade, Inteligência
  description: text('description').notNull(),
});

export const give7Referrals = pgTable('give7_referrals', {
  id: uuid('id').primaryKey().defaultRandom(),
  originCompanyId: uuid('origin_company_id')
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade' }),
  destinationCompanyId: uuid('destination_company_id').references(() => companies.id),
  typeN: integer('type_n')
    .notNull()
    .references(() => give7Types.n),
  description: text('description').notNull(),
  estimatedValue: numeric('estimated_value', { precision: 14, scale: 2 }),
  status: give7StatusEnum('status').notNull().default('sent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Relations (for Drizzle's relational query API)
// ---------------------------------------------------------------------------

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  company: one(companies, { fields: [profiles.id], references: [companies.ownerProfileId] }),
  ledRegion: one(regions, { fields: [profiles.id], references: [regions.cityLeaderProfileId] }),
  uplineRep: one(profiles, { fields: [profiles.uplineRepId], references: [profiles.id] }),
  downlineReps: many(profiles),
}));

export const regionsRelations = relations(regions, ({ one, many }) => ({
  cityLeader: one(profiles, { fields: [regions.cityLeaderProfileId], references: [profiles.id] }),
  chapters: many(chapters),
  companies: many(companies),
}));

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  region: one(regions, { fields: [chapters.regionId], references: [regions.id] }),
  seats: many(seats),
  companies: many(companies),
}));

export const seatsRelations = relations(seats, ({ one, many }) => ({
  chapter: one(chapters, { fields: [seats.chapterId], references: [chapters.id] }),
  company: one(companies, { fields: [seats.companyId], references: [companies.id] }),
  waitlist: many(seatWaitlist),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  owner: one(profiles, { fields: [companies.ownerProfileId], references: [profiles.id] }),
  region: one(regions, { fields: [companies.regionId], references: [regions.id] }),
  chapter: one(chapters, { fields: [companies.chapterId], references: [chapters.id] }),
  subscription: one(subscriptions, { fields: [companies.id], references: [subscriptions.companyId] }),
  methodProgress: many(methodProgress),
  listings: many(marketplaceListings),
  verifications: many(verifications),
}));

export const methodProgressRelations = relations(methodProgress, ({ one }) => ({
  company: one(companies, { fields: [methodProgress.companyId], references: [companies.id] }),
  step: one(methodSteps, { fields: [methodProgress.stepN], references: [methodSteps.n] }),
}));

export const marketplaceListingsRelations = relations(marketplaceListings, ({ one, many }) => ({
  company: one(companies, { fields: [marketplaceListings.companyId], references: [companies.id] }),
  qa: many(marketplaceQa),
  interests: many(marketplaceInterests),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  listing: one(marketplaceListings, { fields: [transactions.listingId], references: [marketplaceListings.id] }),
  originCompany: one(companies, { fields: [transactions.originCompanyId], references: [companies.id] }),
  destinationCompany: one(companies, { fields: [transactions.destinationCompanyId], references: [companies.id] }),
  commissions: many(commissions),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  company: one(companies, { fields: [subscriptions.companyId], references: [companies.id] }),
  plan: one(plans, { fields: [subscriptions.planCode], references: [plans.code] }),
}));

export const give7ReferralsRelations = relations(give7Referrals, ({ one }) => ({
  originCompany: one(companies, { fields: [give7Referrals.originCompanyId], references: [companies.id] }),
  destinationCompany: one(companies, { fields: [give7Referrals.destinationCompanyId], references: [companies.id] }),
  type: one(give7Types, { fields: [give7Referrals.typeN], references: [give7Types.n] }),
}));

// Re-export sql for migration files that need raw fragments.
export { sql };
