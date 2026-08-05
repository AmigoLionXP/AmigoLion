import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

// Cliente para uso em Client Components. Usa a anon key — todo o acesso
// passa pelas policies de RLS definidas nas migrações.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
