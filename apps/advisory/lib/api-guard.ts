import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AuthError } from './auth';

type Handler = (req: Request, ctx: { params: Record<string, string> }) => Promise<Response>;

/** Wraps a route handler, translating AuthError/ZodError into the right HTTP response. */
export function withErrorHandling(handler: Handler): Handler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof AuthError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      if (err instanceof ZodError) {
        return NextResponse.json({ error: 'Dados inválidos.', issues: err.issues }, { status: 400 });
      }
      console.error(err);
      return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
    }
  };
}
