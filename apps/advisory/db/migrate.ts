import 'dotenv/config';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import postgres from 'postgres';

/**
 * Applies every `supabase/migrations/*.sql` file (drizzle-kit-generated schema migrations AND
 * hand-written ones like RLS policies) in filename order, tracking what's already run in a
 * `_migrations` table — a plain custom runner instead of Drizzle's built-in migrator because this
 * project intentionally mixes generated migrations with hand-written SQL (RLS policies, the
 * on_auth_user_created trigger) that drizzle-kit generate doesn't know how to produce.
 *
 * Run with a privileged connection (Supabase's direct/`postgres` role — see .env.example);
 * pooled connections in transaction mode can't run some of the DDL here reliably.
 */

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set — copy .env.example to .env and fill it in.');
}

const MIGRATIONS_DIR = join(__dirname, '..', 'supabase', 'migrations');

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

  await sql`create table if not exists public._migrations (filename text primary key, applied_at timestamptz not null default now())`;

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const already = new Set((await sql`select filename from public._migrations`).map((r) => r.filename as string));

  for (const file of files) {
    if (already.has(file)) {
      console.log(`skip  ${file} (already applied)`);
      continue;
    }
    console.log(`apply ${file}`);
    const content = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8');
    await sql.begin(async (tx) => {
      await tx.unsafe(content);
      await tx`insert into public._migrations (filename) values (${file})`;
    });
  }

  console.log('Done.');
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
