import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { PapelUsuario } from "@/types/database.types";

export interface UsuarioAtual {
  id: string;
  email: string;
  papel: PapelUsuario;
}

// Helper para Server Components / Route Handlers: usuário autenticado + seu
// papel de negócio. Retorna null se não houver sessão — nunca lança erro,
// quem chama decide se redireciona ou responde 401/403.
export async function getUsuarioAtual(): Promise<UsuarioAtual | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: perfil } = await supabase.from("usuarios").select("id, email, papel").eq("id", user.id).single();

  if (!perfil) return null;

  return perfil;
}

// Garante que o usuário atual tem um dos papéis permitidos. Lança para o
// chamador decidir a resposta (a checagem "de verdade" é sempre a RLS no
// banco — isto é só a camada de UX/roteamento).
export async function requireRole(...papeisPermitidos: PapelUsuario[]): Promise<UsuarioAtual> {
  const usuario = await getUsuarioAtual();
  if (!usuario || !papeisPermitidos.includes(usuario.papel)) {
    throw new Error("FORBIDDEN");
  }
  return usuario;
}
