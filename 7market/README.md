# 7MARKET — Backend

Backend da 7MARKET (Next.js + Supabase), implementado a partir do brief em
`market_brief_claude_code_backend.md`. Este projeto vive dentro do
repositório AmigoLion, isolado do site estático do AmigoLion na raiz — os
dois produtos não compartilham código.

Progresso segue a ordem sugerida no brief (Seção 9). Feito até agora:

1. ✅ Autenticação + papéis + RLS no Supabase (`usuarios`, `empresas`,
   `representantes`, `especialistas`)
2. ✅ Modelo de assinatura + cálculo de comissão em cascata
3. ⬜ Growth Score básico
4. ⬜ Pipeline de tarefas e auditoria
5. ⬜ Integração real dos agentes de IA por especialista
6. ⬜ Assinatura digital
7. ⬜ Comunidade e marketplace de indicação
8. ⬜ Integrações externas via API/MCP
9. ⬜ Agregação do Growth Score para licenciamento

## Setup

```bash
cd 7market
npm install
cp .env.local.example .env.local   # preencher com as credenciais do projeto Supabase
```

### Banco de dados

As migrações estão em `supabase/migrations/`, na ordem em que devem ser
aplicadas (`0001_...` até `0006_...`). Com a [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase link --project-ref <seu-project-ref>
supabase db push
```

Ou cole o conteúdo de cada arquivo, em ordem, no SQL Editor do painel
Supabase.

### Rodando localmente

```bash
npm run dev
```

## Decisões e o porquê

- **`current_papel()`, `cadeia_upline()`, `cadeia_downline()`** (funções SQL
  `security definer`): toda política de RLS do projeto depende delas para
  saber "quem é o usuário atual" e "que rede ele enxerga" sem cair em
  recursão de RLS nem duplicar essa lógica em cada policy.
- **`proxy.ts`** (não `middleware.ts`): no Next.js 16 o arquivo de middleware
  foi renomeado para `proxy.ts`/função `proxy` — ver
  `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`.
  Ele só faz a primeira barreira de UX (redirecionar quem não devia estar
  numa rota); a autorização real é sempre a RLS no Postgres.
- **Comissão nunca é síncrona no checkout** (brief Seção 6): só existe uma
  forma de gerar linha em `comissoes`, a função `gerar_comissoes_por_pagamento`,
  chamada pelo webhook de pagamento (`/api/webhooks/pagamento`) ou pelo cron
  mensal de conciliação (`/api/cron/comissoes-mensal`). Ambos rodam com a
  service role; a tabela não tem policy de insert para usuários autenticados.
- **Teto de 28% validado na configuração, não no cálculo** (brief Seção 6):
  o trigger em `niveis_comissao` impede que a soma dos percentuais
  cadastrados ultrapasse 28% — o cálculo em runtime só soma o que já foi
  validado.
- **Gateway de pagamento**: decisão pendente (brief Seção 10). O webhook
  assume um payload genérico com assinatura HMAC; trocar
  `verificarAssinatura` em `src/app/api/webhooks/pagamento/route.ts` pelo
  esquema do provedor escolhido quando definido — o resto do fluxo
  (idempotência via `pagamentos_assinatura.gateway_evento_id`, chamada da
  RPC) não muda.
- **Licença de especialista de área regulada** (brief Seção 5): o campo
  `especialistas.licenca` já existe e pode ficar vazio em dev, mas o
  bloqueio de fato (impedir assinatura sem licença) só é implementado na
  Etapa 6, junto com `assinaturas_digitais` — não faz sentido bloquear antes
  de essa tabela existir.

## Próximos passos

Seguir a Seção 9 do brief a partir da Etapa 3 (Growth Score básico), uma
etapa por vez.
