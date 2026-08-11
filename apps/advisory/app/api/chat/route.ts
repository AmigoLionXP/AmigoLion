import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withErrorHandling } from '@/lib/api-guard';
import { getAiProvider } from '@/lib/providers/ai';

const chatSchema = z.object({
  question: z.string().trim().min(1).max(2000),
  diagDone: z.boolean().default(false),
  level: z.string().default('7M1'),
});

/** POST /api/chat — "Guia 7M AI". Public (matches the floating chat button on every screen). */
export const POST = withErrorHandling(async (req) => {
  const body = chatSchema.parse(await req.json());
  const reply = await getAiProvider().reply(body.question, { diagDone: body.diagDone, level: body.level });
  return NextResponse.json({ reply });
});
