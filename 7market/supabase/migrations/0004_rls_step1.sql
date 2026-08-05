-- 7MARKET — Etapa 1: RLS para representantes, empresas, especialistas.
-- Regra geral: papel público não tem policy nenhuma (default deny); admin
-- sempre tem acesso total; cada papel só enxerga o que é seu.

alter table public.representantes enable row level security;
alter table public.empresas enable row level security;
alter table public.especialistas enable row level security;

-- representantes ---------------------------------------------------------

create policy representantes_select on public.representantes
for select
using (
  usuario_id = auth.uid()
  or public.current_papel() = 'admin'
  or id in (select id from public.cadeia_downline(public.representante_id_atual()))
);

-- Cadastro de representante é fluxo administrativo (contrato, KYC) — feito
-- por admin/back-office, nunca pelo próprio representante se auto-inserindo
-- ou inserindo outro (isso é o que a Seção 6 proíbe gerar comissão).
create policy representantes_insert_admin on public.representantes
for insert
with check (public.current_papel() = 'admin');

create policy representantes_update_admin on public.representantes
for update
using (public.current_papel() = 'admin')
with check (public.current_papel() = 'admin');

-- empresas ----------------------------------------------------------------

create policy empresas_select on public.empresas
for select
using (
  usuario_id = auth.uid()
  or public.current_papel() = 'admin'
  or (
    public.current_papel() = 'representante'
    and representante_id in (select id from public.cadeia_downline(public.representante_id_atual()))
  )
);

create policy empresas_insert_self on public.empresas
for insert
with check (usuario_id = auth.uid() or public.current_papel() = 'admin');

create policy empresas_update_self_or_admin on public.empresas
for update
using (usuario_id = auth.uid() or public.current_papel() = 'admin')
with check (usuario_id = auth.uid() or public.current_papel() = 'admin');

-- status, premium e representante_id são campos administrativos/billing
-- (ativados por pagamento confirmado, atribuição de carteira etc.) — o dono
-- da empresa não pode alterá-los diretamente, só o admin ou o backend com
-- service role (que ignora RLS).
create or replace function public.bloquear_campos_administrativos_empresa()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_papel() = 'admin' then
    return new;
  end if;

  if new.status is distinct from old.status
    or new.premium is distinct from old.premium
    or new.representante_id is distinct from old.representante_id
  then
    raise exception 'status, premium e representante_id só podem ser alterados por admin';
  end if;

  return new;
end;
$$;

create trigger trg_bloquear_campos_administrativos_empresa
before update on public.empresas
for each row execute function public.bloquear_campos_administrativos_empresa();

-- especialistas -------------------------------------------------------------

create policy especialistas_select on public.especialistas
for select
using (usuario_id = auth.uid() or public.current_papel() = 'admin');

-- Cadastro/edição de especialista (inclusive o campo licenca, crítico para
-- a Seção 5) é administrativo.
create policy especialistas_insert_admin on public.especialistas
for insert
with check (public.current_papel() = 'admin');

create policy especialistas_update_admin on public.especialistas
for update
using (public.current_papel() = 'admin')
with check (public.current_papel() = 'admin');
