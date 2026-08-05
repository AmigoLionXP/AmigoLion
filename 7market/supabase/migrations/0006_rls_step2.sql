-- 7MARKET — Etapa 2: RLS para assinaturas, niveis_comissao,
-- pagamentos_assinatura e comissoes.

alter table public.assinaturas enable row level security;
alter table public.niveis_comissao enable row level security;
alter table public.pagamentos_assinatura enable row level security;
alter table public.comissoes enable row level security;

-- assinaturas ---------------------------------------------------------------

create policy assinaturas_select on public.assinaturas
for select
using (
  public.current_papel() = 'admin'
  or empresa_id in (select id from public.empresas where usuario_id = auth.uid())
  or (
    public.current_papel() = 'representante'
    and empresa_id in (
      select id from public.empresas
      where representante_id in (select id from public.cadeia_downline(public.representante_id_atual()))
    )
  )
);

-- Criação/ativação de assinatura é fluxo de billing: o endpoint server-side
-- que processa o checkout usa a service role (ignora RLS). Aqui só admin
-- tem insert/update via client autenticado; status='ativa' nunca é setado
-- pelo próprio empreendedor.
create policy assinaturas_insert_admin on public.assinaturas
for insert
with check (public.current_papel() = 'admin');

create policy assinaturas_update_admin on public.assinaturas
for update
using (public.current_papel() = 'admin')
with check (public.current_papel() = 'admin');

-- niveis_comissao -------------------------------------------------------------

-- Configuração pública de percentuais: qualquer usuário autenticado pode ler
-- (é informação comercial, não sensível), só admin edita.
create policy niveis_comissao_select_authenticated on public.niveis_comissao
for select
using (auth.role() = 'authenticated');

create policy niveis_comissao_write_admin on public.niveis_comissao
for insert
with check (public.current_papel() = 'admin');

create policy niveis_comissao_update_admin on public.niveis_comissao
for update
using (public.current_papel() = 'admin')
with check (public.current_papel() = 'admin');

-- pagamentos_assinatura -------------------------------------------------------

-- Tabela interna de conciliação financeira: só admin lê via client
-- autenticado. Escrita é exclusiva do webhook/cron rodando com service role.
create policy pagamentos_assinatura_select_admin on public.pagamentos_assinatura
for select
using (public.current_papel() = 'admin');

-- comissoes -------------------------------------------------------------------

create policy comissoes_select on public.comissoes
for select
using (
  public.current_papel() = 'admin'
  or representante_id = public.representante_id_atual()
);

-- Sem policy de insert/update/delete para authenticated: linhas só existem
-- via gerar_comissoes_por_pagamento (security definer, grant restrito a
-- service_role). Confirmação de pagamento de comissão (status_pagamento)
-- também é fluxo de back-office/service role.
