-- 7MARKET — Etapa 1: representantes, empresas, especialistas.
-- Ordem de criação respeita as FKs: representantes antes de empresas
-- (empresas.representante_id -> representantes.id).

create table public.representantes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null unique references public.usuarios (id) on delete restrict,
  nivel nivel_representante not null,
  territorio text not null,
  upline_id uuid references public.representantes (id),
  status status_representante not null default 'ativo',
  tipo_contrato text not null,
  criado_em timestamptz not null default now(),
  constraint representantes_upline_nao_e_ele_mesmo check (upline_id is null or upline_id <> id)
);

comment on table public.representantes is 'Escada de representação comercial (Comunit..Internacional). Ver brief Seção 2 e 3.';

create table public.empresas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios (id) on delete restrict,
  razao_social text not null,
  cnpj text not null unique,
  segmento segmento_empresa not null,
  faixa_faturamento faixa_faturamento not null,
  representante_id uuid references public.representantes (id),
  status status_empresa not null default 'ativo',
  premium boolean not null default false,
  criado_em timestamptz not null default now()
);

create table public.especialistas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null unique references public.usuarios (id) on delete restrict,
  area area_especialista not null,
  licenca text,
  capacidade_mensal integer not null default 0 check (capacidade_mensal >= 0),
  criado_em timestamptz not null default now()
);

comment on column public.especialistas.licenca is
  'CRC/OAB/registro. Pode ficar vazio em dev (brief Seção 10), mas o bloqueio de assinatura '
  'para área regulada sem licença (Seção 5) é aplicado na Etapa 6 (assinaturas_digitais).';

-- Cadeia "para cima": o próprio representante + todos os uplines, na ordem em
-- que aparecem subindo a escada. Usada para empilhar o cálculo de comissão
-- (Seção 6) e para políticas de RLS que remetem à hierarquia.
create or replace function public.cadeia_upline(rep_id uuid)
returns table (id uuid, nivel nivel_representante)
language sql
security definer
stable
set search_path = public
as $$
  with recursive cadeia as (
    select r.id, r.nivel, r.upline_id
    from public.representantes r
    where r.id = rep_id

    union all

    select r.id, r.nivel, r.upline_id
    from public.representantes r
    join cadeia c on r.id = c.upline_id
  )
  select id, nivel from cadeia;
$$;

-- Cadeia "para baixo": o próprio representante + toda a rede/downline abaixo
-- dele. Usada para limitar o que um representante enxerga (nunca empresas
-- fora da sua carteira, Seção 2).
create or replace function public.cadeia_downline(rep_id uuid)
returns table (id uuid)
language sql
security definer
stable
set search_path = public
as $$
  with recursive cadeia as (
    select r.id, r.upline_id
    from public.representantes r
    where r.id = rep_id

    union all

    select r.id, r.upline_id
    from public.representantes r
    join cadeia c on r.upline_id = c.id
  )
  select id from cadeia;
$$;

-- Atalho: id do representante vinculado ao usuário autenticado (null se o
-- usuário atual não for representante).
create or replace function public.representante_id_atual()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select id from public.representantes where usuario_id = auth.uid();
$$;
