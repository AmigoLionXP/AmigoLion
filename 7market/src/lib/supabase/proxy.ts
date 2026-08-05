import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database, PapelUsuario } from "@/types/database.types";

// Prefixo de rota -> papéis autorizados (admin sempre tem acesso, adicionado
// automaticamente). Ajustar conforme as rotas do front-end forem definidas.
const ROTAS_PROTEGIDAS: { prefixo: string; papeis: PapelUsuario[] }[] = [
  { prefixo: "/admin", papeis: ["admin"] },
  { prefixo: "/empreendedor", papeis: ["empreendedor"] },
  { prefixo: "/representante", papeis: ["representante"] },
  { prefixo: "/especialista", papeis: ["especialista"] },
];

// Renova a sessão a cada request e bloqueia acesso a rotas de papel
// específico antes de a página renderizar. Isto é só a primeira barreira —
// a autorização de verdade é a RLS no banco (nunca confiar só nisto).
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const regra = ROTAS_PROTEGIDAS.find((r) => request.nextUrl.pathname.startsWith(r.prefixo));
  if (!regra) return response;

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  const { data: perfil } = await supabase.from("usuarios").select("papel").eq("id", user.id).single();

  const papeisPermitidos = [...regra.papeis, "admin"];
  if (!perfil || !papeisPermitidos.includes(perfil.papel)) {
    const url = request.nextUrl.clone();
    url.pathname = "/nao-autorizado";
    return NextResponse.redirect(url);
  }

  return response;
}
