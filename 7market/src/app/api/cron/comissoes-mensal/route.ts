import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Job mensal de conciliação (brief Seção 6: "job mensal ou por evento de
// pagamento confirmado via webhook"). O webhook (route.ts em
// api/webhooks/pagamento) é o caminho principal; este cron é uma rede de
// segurança que roda gerar_comissoes_por_pagamento para qualquer pagamento
// já confirmado (presente em pagamentos_assinatura) cuja comissão ainda não
// foi gerada — a RPC é idempotente (ON CONFLICT DO NOTHING), então rodar de
// novo para um pagamento já processado não duplica nada.
//
// Configurar como Vercel Cron mensal (vercel.json) apontando pra cá com o
// header Authorization: Bearer $CRON_SECRET.

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: pagamentos, error: erroPagamentos } = await supabase
    .from("pagamentos_assinatura")
    .select("assinatura_id, mes_referencia");

  if (erroPagamentos) {
    return NextResponse.json({ error: erroPagamentos.message }, { status: 500 });
  }

  const resultados: { assinatura_id: string; mes_referencia: string; ok: boolean; erro?: string }[] = [];

  for (const pagamento of pagamentos ?? []) {
    const { error } = await supabase.rpc("gerar_comissoes_por_pagamento", {
      p_assinatura_id: pagamento.assinatura_id,
      p_mes_referencia: pagamento.mes_referencia,
    });

    resultados.push({
      assinatura_id: pagamento.assinatura_id,
      mes_referencia: pagamento.mes_referencia,
      ok: !error,
      erro: error?.message,
    });
  }

  return NextResponse.json({
    processados: resultados.length,
    falhas: resultados.filter((r) => !r.ok).length,
    resultados,
  });
}
