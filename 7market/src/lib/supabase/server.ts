import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";

// Cliente para uso em Server Components, Server Actions e Route Handlers.
// Ainda usa a anon key + cookies de sessão do usuário — RLS continua valendo.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // set() chamado a partir de um Server Component: ignorável quando
            // há middleware renovando a sessão a cada request.
          }
        },
      },
    }
  );
}
