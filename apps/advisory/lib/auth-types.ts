/** Split out from lib/auth.ts so Client Components can import the `Role` type without pulling in
 * server-only code (next/headers, the DB client) into the browser bundle. */
export type Role = 'member' | 'rep' | 'admin';
