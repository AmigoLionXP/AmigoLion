import { z } from 'zod';

export const wizardSubmitSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email(),
  sector: z.string().trim().max(120).optional(),
  companyAge: z.enum(['Menos de 1 ano', '1 a 3 anos', '3 a 10 anos', 'Mais de 10 anos']).optional(),
  revenueRange: z.enum(['Até R$ 20 mil/mês', 'R$ 20–100 mil', 'R$ 100–500 mil', 'Acima de R$ 500 mil']).optional(),
  challenge: z.enum(['growth', 'finance', 'owner', 'capital', 'scale', 'legacy']),
  scheduledDay: z.string().trim().max(40).optional(),
  scheduledSlot: z.string().trim().max(20).optional(),
  scheduledFormat: z.enum(['Vídeo-chamada', 'WhatsApp', 'Presencial · BH']).optional(),
});

export const companyUpdateSchema = z.object({
  legalName: z.string().trim().min(1).max(200).optional(),
  tradeName: z.string().trim().max(200).nullable().optional(),
  cnpj: z
    .string()
    .trim()
    .regex(/^\d{14}$/, 'CNPJ deve ter 14 dígitos')
    .nullable()
    .optional(),
  sector: z.string().trim().max(120).nullable().optional(),
});

export const methodProgressUpdateSchema = z.object({
  status: z.enum(['locked', 'next', 'doing', 'done']).optional(),
  pct: z.number().int().min(0).max(100).optional(),
});

export const listingCreateSchema = z.object({
  type: z.enum(['offer', 'intent']).default('offer'),
  category: z.enum(['product', 'service', 'equipment']).default('product'),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(4000),
  priceLabel: z.string().trim().max(80).optional(),
  location: z.string().trim().max(120).optional(),
  qa: z
    .array(z.object({ question: z.string().trim().min(1).max(300), answer: z.string().trim().min(1).max(1000) }))
    .max(10)
    .optional(),
});

export const listingUpdateSchema = listingCreateSchema.partial().extend({
  status: z.enum(['active', 'paused', 'removed']).optional(),
});

export const interestCreateSchema = z.object({
  message: z.string().trim().max(1000).optional(),
});

export const give7CreateSchema = z.object({
  destinationCompanyId: z.string().uuid().optional(),
  typeN: z.number().int().min(1).max(7),
  description: z.string().trim().min(1).max(2000),
  estimatedValue: z.number().nonnegative().optional(),
});

export const verificationReviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
});

export const checkoutCreateSchema = z.object({
  planCode: z.enum(['7M0', '7M1', '7M2', '7M3', '7M4', '7M5', '7M6', '7M7']),
});
