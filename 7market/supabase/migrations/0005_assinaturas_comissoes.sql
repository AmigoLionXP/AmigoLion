-- 7MARKET — Etapa 2: assinaturas + comissão em cascata (brief Seção 6).
--
-- Nomenclatura: os "níveis da escada" da Seção 6 (1% a 7%, teto 28% = soma de
-- 1+2+3+4+5+6+7) são os 7 níveis de representantes.nivel — não confundir com
-- empresas.faixa_faturamento (também rotulada 7M1..7M7, mas é outra coisa).

create table public.assinaturas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete restrict,
  nivel faixa_faturamento not null,
  valor_mensal numeric(12, 2) not null check (valor_mensal >= 0),
  premium boolean not null default false,
  status status_assinatura not null default 'pendente',
  ciclo_cobranca text not null default 'mensal',
  data_inicio date,
  criado_em timestamptz not null default now()
);

-- Percentual fixo por nível da escada. Tabela de configuração — o teto de
-- 28% é validado aqui (na configuração), nunca recalculado em runtime.
create table public.niveis_comissao (
  nivel nivel_representante primary key,
  percentual numeric(5, 2) not null check (percentual > 0)
);

create or replace function public.validar_teto_niveis_comissao()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  total numeric;
begin
  select coalesce(sum(percentual), 0) into total from public.niveis_comissao;
  if total > 28 then
    raise exception 'soma dos percentuais de comissao (%.2f%%) ultrapassa o teto de 28%%', total;
  end if;
  return new;
end;
$$;

create trigger trg_validar_teto_niveis_comissao
after insert or update on public.niveis_comissao
for each row execute function public.validar_teto_niveis_comissao();

insert into public.niveis_comissao (nivel, percentual) values
  ('Comunit', 1),
  ('City', 2),
  ('Estadual', 3),
  ('Regional', 4),
  ('Nacional', 5),
  ('Continental', 6),
  ('Internacional', 7);

-- Registro do pagamento confirmado pelo gateway (webhook). Existe para dar
-- idempotência ao processamento (gateway_evento_id único) e trilha de
-- auditoria — o gateway específico é decisão pendente (brief Seção 10),
-- mas o contrato de dados não depende de qual for escolhido.
create table public.pagamentos_assinatura (
  id uuid primary key default gen_random_uuid(),
  assinatura_id uuid not null references public.assinaturas (id) on delete restrict,
  gateway_evento_id text not null unique,
  valor numeric(12, 2) not null,
  mes_referencia date not null,
  confirmado_em timestamptz not null default now()
);

create table public.comissoes (
  id uuid primary key default gen_random_uuid(),
  representante_id uuid not null references public.representantes (id) on delete restrict,
  -- NOT NULL por design: comissão só existe atrelada a uma assinatura paga
  -- (brief Seção 5 — nunca a partir de cadastro de novo representante).
  assinatura_id uuid not null references public.assinaturas (id) on delete restrict,
  percentual numeric(5, 2) not null check (percentual > 0),
  valor numeric(12, 2) not null check (valor >= 0),
  mes_referencia date not null,
  status_pagamento status_pagamento_comissao not null default 'pendente',
  criado_em timestamptz not null default now(),
  unique (representante_id, assinatura_id, mes_referencia)
);

-- Única forma de inserir em comissoes: pagamento confirmado de uma
-- assinatura ativa, percorrendo a cadeia de upline a partir de quem vendeu.
-- security definer + grants abaixo garantem que só o backend (service role,
-- webhook/cron) executa isso — nunca o cálculo síncrono no checkout, nunca
-- o representante inserindo direto.
create or replace function public.gerar_comissoes_por_pagamento(
  p_assinatura_id uuid,
  p_mes_referencia date
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_representante_venda uuid;
  v_valor_assinatura numeric(12, 2);
  v_status status_assinatura;
  rec record;
begin
  select a.valor_mensal, a.status, e.representante_id
    into v_valor_assinatura, v_status, v_representante_venda
  from public.assinaturas a
  join public.empresas e on e.id = a.empresa_id
  where a.id = p_assinatura_id;

  if not found then
    raise exception 'assinatura % nao encontrada', p_assinatura_id;
  end if;

  if v_status is distinct from 'ativa' then
    raise exception 'comissao so pode ser gerada para assinatura ativa (pagamento confirmado); status atual: %', v_status;
  end if;

  if v_representante_venda is null then
    return;
  end if;

  for rec in
    select c.id as representante_id, nc.percentual
    from public.cadeia_upline(v_representante_venda) c
    join public.niveis_comissao nc on nc.nivel = c.nivel
  loop
    insert into public.comissoes (representante_id, assinatura_id, percentual, valor, mes_referencia, status_pagamento)
    values (
      rec.representante_id,
      p_assinatura_id,
      rec.percentual,
      round(v_valor_assinatura * rec.percentual / 100, 2),
      p_mes_referencia,
      'pendente'
    )
    on conflict (representante_id, assinatura_id, mes_referencia) do nothing;
  end loop;
end;
$$;

revoke all on function public.gerar_comissoes_por_pagamento(uuid, date) from public, anon, authenticated;
grant execute on function public.gerar_comissoes_por_pagamento(uuid, date) to service_role;
