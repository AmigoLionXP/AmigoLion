import { eq } from 'drizzle-orm';
import { createClient } from './supabase/server';
import { runAsUser, type Tx } from '@/db/rls-context';
import { profiles } from '@/db/schema';

export type Role = 'member' | 'rep' | 'admin';

export class AuthError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** The Supabase Auth user for this request, or null if there's no session. */
export async function getAuthedUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * The caller's `profiles` row, fetched through the same RLS-scoped transaction every other
 * query goes through — never trust a role/company id the client claims, only what the
 * database itself confirms belongs to auth.uid().
 */
export async function getAuthedProfile() {
  const user = await getAuthedUser();
  if (!user) return null;
  return runAsUser(user.id, async (tx) => {
    const [profile] = await tx.select().from(profiles).where(eq(profiles.id, user.id));
    return profile ?? null;
  });
}

/** Throws AuthError(401/403) unless the caller is signed in with one of `roles`. Returns the profile. */
export async function requireRole(...roles: Role[]) {
  const profile = await getAuthedProfile();
  if (!profile) throw new AuthError(401, 'Não autenticado.');
  if (!roles.includes(profile.role)) throw new AuthError(403, 'Sem permissão para este recurso.');
  return profile;
}

/**
 * Runs `fn` inside the caller's RLS-scoped transaction, after confirming their role is one of
 * `roles`. This is the one helper most route handlers need: it gets you a guarded profile AND
 * a `tx` where every query is automatically tenant-scoped by Postgres.
 */
export async function withAuth<T>(roles: Role[], fn: (tx: Tx, profile: typeof profiles.$inferSelect) => Promise<T>): Promise<T> {
  const user = await getAuthedUser();
  if (!user) throw new AuthError(401, 'Não autenticado.');
  return runAsUser(user.id, async (tx) => {
    const [profile] = await tx.select().from(profiles).where(eq(profiles.id, user.id));
    if (!profile) throw new AuthError(401, 'Perfil não encontrado.');
    if (!roles.includes(profile.role)) throw new AuthError(403, 'Sem permissão para este recurso.');
    return fn(tx, profile);
  });
}
