import { sql } from 'drizzle-orm';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import { db } from './client';
import type * as schema from './schema';

export type Tx = PgTransaction<any, typeof schema, any>;

/**
 * Runs `fn` inside a Postgres transaction with the session's role/JWT claim set to mirror what
 * PostgREST would set for this user — so every Drizzle query inside `fn` is subject to the exact
 * same RLS policies verified in supabase/migrations/0001_rls.sql, instead of running with the
 * app's full DB privileges. This is the load-bearing tenant-isolation boundary: route handlers
 * must never build their own `WHERE company_id = …` filters from trusted-by-convention values —
 * they run everything through this wrapper and let Postgres enforce the boundary.
 *
 * `userId: null` runs as the `anon` role (matches an unauthenticated request — only tables with
 * an explicit anon policy, like plans or wizard_leads inserts, will be reachable).
 */
export async function runAsUser<T>(userId: string | null, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    if (userId) {
      await tx.execute(sql`select set_config('request.jwt.claim.sub', ${userId}, true)`);
      await tx.execute(sql`set local role authenticated`);
    } else {
      await tx.execute(sql`set local role anon`);
    }
    return fn(tx as unknown as Tx);
  });
}
