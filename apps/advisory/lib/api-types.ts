/** Hand-written response shapes for the dashboard's client-side fetches — kept separate from
 * db/schema.ts so Client Components never need to bundle drizzle-orm. */

export type PlanCode = '7M0' | '7M1' | '7M2' | '7M3' | '7M4' | '7M5' | '7M6' | '7M7';

export interface Company {
  id: string;
  ownerProfileId: string;
  legalName: string;
  tradeName: string | null;
  cnpj: string | null;
  sector: string | null;
  regionId: string | null;
  chapterId: string | null;
  planCode: PlanCode;
  verified: boolean;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MethodStepProgress {
  id: string;
  companyId: string;
  stepN: number;
  status: 'locked' | 'next' | 'doing' | 'done';
  pct: number;
  startedAt: string | null;
  completedAt: string | null;
  updatedAt: string;
}

export interface MethodStepWithProgress {
  n: number;
  verb: string;
  phase: string;
  specialistRole: string;
  description: string;
  progress: MethodStepProgress | null;
}

export interface MarketplaceListing {
  id: string;
  companyId: string;
  type: 'offer' | 'intent';
  category: 'product' | 'service' | 'equipment';
  title: string;
  description: string;
  priceLabel: string | null;
  location: string | null;
  status: 'active' | 'paused' | 'removed' | 'pending_review';
  createdAt: string;
  updatedAt: string;
}

export interface Give7Referral {
  id: string;
  originCompanyId: string;
  destinationCompanyId: string | null;
  typeN: number;
  description: string;
  estimatedValue: string | null;
  status: 'sent' | 'received' | 'converted';
  createdAt: string;
}

export interface Region {
  id: string;
  name: string;
  state: string | null;
  country: string;
  cityLeaderProfileId: string | null;
  status: 'pilot' | 'active' | 'planned';
  createdAt: string;
}

export interface Chapter {
  id: string;
  regionId: string;
  name: string;
  meetingFrequency: 'weekly' | 'biweekly' | 'monthly';
  createdAt: string;
}

export interface Seat {
  id: string;
  chapterId: string;
  sector: string;
  companyId: string | null;
  status: 'available' | 'occupied' | 'waitlist';
  createdAt: string;
}

export interface Commission {
  id: string;
  transactionId: string;
  type: 'direct' | 'network';
  beneficiaryProfileId: string | null;
  ratePct: string;
  amount: string;
  createdAt: string;
}

export interface RepRegionResponse {
  region: Region;
  chapters: Chapter[];
  companies: Company[];
  seats: Seat[];
  seatsOccupied: number;
  seatsTotal: number;
  commissionMonthTotal: number;
  commissions: Commission[];
}

export interface AdminMetrics {
  activeUsers: number;
  activeCompanies: number;
  mrrCents: number;
  transactionsThisMonth: number;
  avgCommissionPct: number;
}

export interface Transaction {
  id: string;
  listingId: string | null;
  originCompanyId: string | null;
  destinationCompanyId: string | null;
  description: string;
  amount: string;
  status: 'pending' | 'confirmed' | 'canceled';
  createdAt: string;
  confirmedAt: string | null;
  commissions: Commission[];
}

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: 'member' | 'rep' | 'admin';
  createdAt: string;
}

export interface RegionWithCounts extends Region {
  chapterCount: number;
  companyCount: number;
}

export interface VerificationRequest {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  documentPath: string | null;
  createdAt: string;
  companyId: string;
  companyName: string;
  companySector: string | null;
}

export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** `transactions.amount` / `commissions.amount` are stored as whole reais (numeric(14,2)), not
 * cents — only `plans.priceCents` is cents. Don't run this value through formatCents(). */
export function formatBRL(reais: number): string {
  return reais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
