import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set.');
}

// A single shared connection in serverless/edge route handlers would exhaust Supabase's
// connection pool, so keep max low and let pgbouncer (Supabase's pooler) do the heavy lifting;
// point DATABASE_URL at the pooled connection string (port 6543) in production.
const client = postgres(process.env.DATABASE_URL, { max: 1 });

export const db = drizzle(client, { schema });
