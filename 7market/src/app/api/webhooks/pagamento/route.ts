import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Webhook do gateway de pagamento. O gateway definitivo ainda é decisão
// pendente (brief Seção 10) — este handler assume um payload genérico e
// assinatura HMAC (padrão comum a Stripe/PagSeguro/Mercado Pago/etc.).
// Trocar `verificarAssinatura` pelo esquema real do provedor escolhido,
// mantendo o corpo do handler (idempotência + RPC) igual.
//
// IMPORTANTE: comissão nunca é calculada no fluxo síncrono de checkout
// (brief Seção 6) — só aqui, disparada pela confirmação assíncrona de
// pagamento do gateway.

interface PayloadWebhookPagamento {
  gateway_evento_id: string;
  assinatura_id: string;
  valor: number;
  mes_referencia: string; // "YYYY-MM-DD", primeiro dia do mês de referência
}

function verificarAssinatura(corpoBruto: string, assinaturaRecebida: string | null): boolean {
  const segredo = process.env.PAGAMENTO_WEBHOOK_SECRET;
  if (!segredo) {
    throw new Error("PAGAMENTO_WEBHOOK_SECRET não configurado");
  }
  if (!assinaturaRecebida) return false;

  const esperada = createHmac("sha256", segredo).update(corpoBruto).digest("hex");
  const bufEsperada = Buffer.from(esperada);
  const bufRecebida = Buffer.from(assinaturaRecebida);

  return bufEsperada.length === bufRecebida.length && timingSafeEqual(bufEsperada, bufRecebida);
}

export async function POST(request: NextRequest) {
  const corpoBruto = await request.text();
  const assinaturaHeader = request.headers.get("x-webhook-signature");

  if (!verificarAssinatura(corpoBruto, assinaturaHeader)) {
    return NextResponse.json({ error: "assinatura inválida" }, { status: 401 });
  }

  let payload: PayloadWebhookPagamento;
  try {
    payload = JSON.parse(corpoBruto);
  } catch {
    return NextResponse.json({ error: "payload inválido" }, { status: 400 });
  }

  if (!payload.gateway_evento_id || !payload.assinatura_id || !payload.mes_referencia) {
    return NextResponse.json({ error: "campos obrigatórios ausentes" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { error: erroInsert } = await supabase.from("pagamentos_assinatura").insert({
    assinatura_id: payload.assinatura_id,
    gateway_evento_id: payload.gateway_evento_id,
    valor: payload.valor,
    mes_referencia: payload.mes_referencia,
  });

  if (erroInsert) {
    // 23505 = unique_violation: este evento já foi processado antes.
    // Webhooks podem ser reentregues — responder 200 evita reenvio infinito.
    if (erroInsert.code === "23505") {
      return NextResponse.json({ status: "ja_processado" }, { status: 200 });
    }
    return NextResponse.json({ error: erroInsert.message }, { status: 500 });
  }

  const { error: erroUpdate } = await supabase
    .from("assinaturas")
    .update({ status: "ativa" })
    .eq("id", payload.assinatura_id);

  if (erroUpdate) {
    return NextResponse.json({ error: erroUpdate.message }, { status: 500 });
  }

  const { error: erroRpc } = await supabase.rpc("gerar_comissoes_por_pagamento", {
    p_assinatura_id: payload.assinatura_id,
    p_mes_referencia: payload.mes_referencia,
  });

  if (erroRpc) {
    return NextResponse.json({ error: erroRpc.message }, { status: 500 });
  }

  return NextResponse.json({ status: "ok" }, { status: 200 });
}
