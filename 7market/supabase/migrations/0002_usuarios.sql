-- 7MARKET — Etapa 1: usuarios + integração com Supabase Auth.
-- public.usuarios é o perfil de negócio 1:1 com auth.users. auth.users continua
-- sendo a fonte de verdade de autenticação (senha, e-mail confirmado, etc).

create table public.usuarios (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  telefone text,
  papel papel_usuario not null default 'publico',
  criado_em timestamptz not null default now()
);

comment on table public.usuarios is 'Perfil de negócio do usuário autenticado. Ver brief Seção 2 e 3.';

-- Função utilitária usada por praticamente toda política de RLS do projeto:
-- devolve o papel do usuário autenticado atual. security definer + search_path
-- fixo evitam recursão de RLS (a função lê usuarios "por baixo" da política).
create or replace function public.current_papel()
returns papel_usuario
language sql
security definer
stable
set search_path = public
as $$
  select papel from public.usuarios where id = auth.uid();
$$;

-- Cria automaticamente o perfil em public.usuarios quando um usuário se
-- cadastra via Supabase Auth. O papel inicial vem de raw_user_meta_data
-- (definido no signUp do front-end) e cai para 'publico' se ausente.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usuarios (id, email, telefone, papel)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'telefone',
    coalesce((new.raw_user_meta_data ->> 'papel')::papel_usuario, 'publico')
  );
  return new;
end;
$$;

create trigger trg_handle_new_auth_user
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- Ninguém além de admin pode alterar o próprio papel (evita auto-promoção a
-- especialista/representante/admin via update direto na tabela).
create or replace function public.bloquear_autoalteracao_papel()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.papel is distinct from old.papel and public.current_papel() is distinct from 'admin' then
    raise exception 'apenas admin pode alterar o papel de um usuario';
  end if;
  return new;
end;
$$;

create trigger trg_bloquear_autoalteracao_papel
before update on public.usuarios
for each row execute function public.bloquear_autoalteracao_papel();

alter table public.usuarios enable row level security;

create policy usuarios_select_self_or_admin on public.usuarios
for select
using (id = auth.uid() or public.current_papel() = 'admin');

create policy usuarios_update_self_or_admin on public.usuarios
for update
using (id = auth.uid() or public.current_papel() = 'admin')
with check (id = auth.uid() or public.current_papel() = 'admin');

-- Não há policy de insert/delete para authenticated: o perfil é criado
-- exclusivamente pelo trigger (security definer) disparado no signup.
