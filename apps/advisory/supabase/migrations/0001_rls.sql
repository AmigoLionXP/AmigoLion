-- 7M Advisory — Row Level Security
--
-- Three authenticated roles (Público is just "no session"):
--   member  — sees only their own company (companies.owner_profile_id = auth.uid())
--   rep     — City Leader; sees only their own região (regions.city_leader_profile_id = auth.uid())
--   admin   — sees everything
--
-- Helper functions are SECURITY DEFINER so a policy on `profiles` can safely call a function
-- that itself reads `profiles` without infinite RLS recursion (the function body runs with the
-- privileges of its owner, bypassing RLS for that one lookup — the standard Supabase pattern).
-- Every function pins search_path to prevent search-path hijacking.

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------

create or replace function public.current_role()
returns text
language sql stable security definer set search_path = public
as $$
  select role::text from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.current_company_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select id from public.companies where owner_profile_id = auth.uid();
$$;

create or replace function public.current_region_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select id from public.regions where city_leader_profile_id = auth.uid();
$$;

/** True if `target_company` belongs to the region the caller leads as Rep. */
create or replace function public.is_company_in_my_region(target_company uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.companies c
    where c.id = target_company and c.region_id = public.current_region_id()
  );
$$;

revoke all on function public.current_role() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.current_company_id() from public;
revoke all on function public.current_region_id() from public;
revoke all on function public.is_company_in_my_region(uuid) from public;
grant execute on function public.current_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.current_company_id() to authenticated;
grant execute on function public.current_region_id() to authenticated;
grant execute on function public.is_company_in_my_region(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Auto-create a profile row when someone signs up (Supabase Auth trigger).
-- Reads full_name from the signup call's options.data (raw_user_meta_data), but role is always
-- hardcoded to 'member' here — NOT read from metadata. raw_user_meta_data is client-supplied
-- (anyone calling supabase.auth.signUp() from the browser controls it), so trusting a 'role' key
-- from it would let any anonymous signup self-elevate to 'admin'. 'rep'/'admin' accounts are
-- provisioned out-of-band (db/seed.ts's supabase.auth.admin.createUser(), or a future
-- Admin-only promotion route) and have their profiles.role set directly with the service role
-- key — never through this trigger.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, email)
  values (
    new.id,
    'member'::public.role,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- Table-level GRANTs — RLS policies only narrow which *rows* a role can touch;
-- the role also needs baseline SQL privileges to attempt the operation at all.
-- Supabase's own dashboard/CLI provisioning usually adds these automatically, but they're
-- declared explicitly here so this schema is correct on any Postgres, not just a pre-provisioned
-- Supabase project.
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on public.plans, public.give7_types, public.method_steps to anon;
grant insert on public.wizard_leads to anon;

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.regions enable row level security;
alter table public.chapters enable row level security;
alter table public.seats enable row level security;
alter table public.seat_waitlist enable row level security;
alter table public.companies enable row level security;
alter table public.verifications enable row level security;
alter table public.wizard_leads enable row level security;
alter table public.method_steps enable row level security;
alter table public.method_progress enable row level security;
alter table public.marketplace_listings enable row level security;
alter table public.marketplace_qa enable row level security;
alter table public.marketplace_interests enable row level security;
alter table public.transactions enable row level security;
alter table public.commissions enable row level security;
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.give7_types enable row level security;
alter table public.give7_referrals enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create policy "profiles_select" on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or public.is_admin()
    or (public.current_role() = 'rep' and id in (
      select owner_profile_id from public.companies where region_id = public.current_region_id()
    ))
  );

create policy "profiles_update_self" on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- No client-side INSERT policy: rows are created only by the on_auth_user_created trigger
-- (SECURITY DEFINER, bypasses RLS) or directly by an Admin via the service role.

-- ---------------------------------------------------------------------------
-- regions ("praças")
-- ---------------------------------------------------------------------------

create policy "regions_select" on public.regions for select to authenticated
  using (
    public.is_admin()
    or city_leader_profile_id = auth.uid()
    or id = (select region_id from public.companies where owner_profile_id = auth.uid())
  );

create policy "regions_admin_write" on public.regions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- chapters ("capítulos")
-- ---------------------------------------------------------------------------

create policy "chapters_select" on public.chapters for select to authenticated
  using (
    public.is_admin()
    or region_id = public.current_region_id()
    or region_id = (select region_id from public.companies where owner_profile_id = auth.uid())
  );

create policy "chapters_write" on public.chapters for all to authenticated
  using (public.is_admin() or region_id = public.current_region_id())
  with check (public.is_admin() or region_id = public.current_region_id());

-- ---------------------------------------------------------------------------
-- seats
-- ---------------------------------------------------------------------------

create policy "seats_select" on public.seats for select to authenticated
  using (
    public.is_admin()
    or company_id = public.current_company_id()
    or chapter_id in (select id from public.chapters where region_id = public.current_region_id())
    or chapter_id in (
      select id from public.chapters
      where region_id = (select region_id from public.companies where owner_profile_id = auth.uid())
    )
  );

create policy "seats_write" on public.seats for all to authenticated
  using (
    public.is_admin()
    or chapter_id in (select id from public.chapters where region_id = public.current_region_id())
  )
  with check (
    public.is_admin()
    or chapter_id in (select id from public.chapters where region_id = public.current_region_id())
  );

-- ---------------------------------------------------------------------------
-- seat_waitlist
-- ---------------------------------------------------------------------------

create policy "seat_waitlist_select" on public.seat_waitlist for select to authenticated
  using (
    public.is_admin()
    or company_id = public.current_company_id()
    or seat_id in (
      select s.id from public.seats s join public.chapters c on c.id = s.chapter_id
      where c.region_id = public.current_region_id()
    )
  );

create policy "seat_waitlist_insert" on public.seat_waitlist for insert to authenticated
  with check (company_id = public.current_company_id());

create policy "seat_waitlist_delete" on public.seat_waitlist for delete to authenticated
  using (public.is_admin() or company_id = public.current_company_id());

-- ---------------------------------------------------------------------------
-- companies (the Member tenant)
-- ---------------------------------------------------------------------------

create policy "companies_select" on public.companies for select to authenticated
  using (
    owner_profile_id = auth.uid()
    or public.is_admin()
    or (public.current_role() = 'rep' and region_id = public.current_region_id())
  );

create policy "companies_insert_self" on public.companies for insert to authenticated
  with check (owner_profile_id = auth.uid() or public.is_admin());

create policy "companies_update" on public.companies for update to authenticated
  using (owner_profile_id = auth.uid() or public.is_admin())
  with check (owner_profile_id = auth.uid() or public.is_admin());

create policy "companies_delete_admin" on public.companies for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- verifications ("7M Verified")
-- ---------------------------------------------------------------------------

create policy "verifications_select" on public.verifications for select to authenticated
  using (
    public.is_admin()
    or company_id = public.current_company_id()
    or public.is_company_in_my_region(company_id)
  );

create policy "verifications_insert" on public.verifications for insert to authenticated
  with check (company_id = public.current_company_id());

create policy "verifications_review_admin" on public.verifications for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- wizard_leads — public funnel; anon can submit, only Admin reads/manages
-- ---------------------------------------------------------------------------

create policy "wizard_leads_insert_anyone" on public.wizard_leads for insert to anon, authenticated
  with check (true);

create policy "wizard_leads_select_admin" on public.wizard_leads for select to authenticated
  using (public.is_admin());

create policy "wizard_leads_update_admin" on public.wizard_leads for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- method_steps — static reference, readable by anyone signed in, admin-managed
-- ---------------------------------------------------------------------------

create policy "method_steps_select" on public.method_steps for select to authenticated using (true);
create policy "method_steps_admin_write" on public.method_steps for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- method_progress — per-company esteira
-- ---------------------------------------------------------------------------

create policy "method_progress_select" on public.method_progress for select to authenticated
  using (
    public.is_admin()
    or company_id = public.current_company_id()
    or public.is_company_in_my_region(company_id)
  );

create policy "method_progress_write" on public.method_progress for all to authenticated
  using (public.is_admin() or company_id = public.current_company_id())
  with check (public.is_admin() or company_id = public.current_company_id());

-- ---------------------------------------------------------------------------
-- marketplace — network-wide by design: any authenticated member can browse
-- other companies' active listings; only the owner (or Admin) sees drafts/pending/paused ones.
-- ---------------------------------------------------------------------------

create policy "listings_select" on public.marketplace_listings for select to authenticated
  using (status = 'active' or company_id = public.current_company_id() or public.is_admin());

create policy "listings_insert" on public.marketplace_listings for insert to authenticated
  with check (company_id = public.current_company_id());

create policy "listings_update" on public.marketplace_listings for update to authenticated
  using (company_id = public.current_company_id() or public.is_admin())
  with check (company_id = public.current_company_id() or public.is_admin());

create policy "listings_delete" on public.marketplace_listings for delete to authenticated
  using (company_id = public.current_company_id() or public.is_admin());

create policy "qa_select" on public.marketplace_qa for select to authenticated
  using (
    listing_id in (
      select id from public.marketplace_listings
      where status = 'active' or company_id = public.current_company_id()
    )
    or public.is_admin()
  );

create policy "qa_write" on public.marketplace_qa for all to authenticated
  using (
    listing_id in (select id from public.marketplace_listings where company_id = public.current_company_id())
    or public.is_admin()
  )
  with check (
    listing_id in (select id from public.marketplace_listings where company_id = public.current_company_id())
    or public.is_admin()
  );

create policy "interests_select" on public.marketplace_interests for select to authenticated
  using (
    company_id = public.current_company_id()
    or listing_id in (select id from public.marketplace_listings where company_id = public.current_company_id())
    or public.is_admin()
  );

create policy "interests_insert" on public.marketplace_interests for insert to authenticated
  with check (company_id = public.current_company_id());

-- ---------------------------------------------------------------------------
-- transactions + commissions — financial ledger, written server-side only
-- ---------------------------------------------------------------------------

create policy "transactions_select" on public.transactions for select to authenticated
  using (
    public.is_admin()
    or origin_company_id = public.current_company_id()
    or destination_company_id = public.current_company_id()
    or id in (select transaction_id from public.commissions where beneficiary_profile_id = auth.uid())
  );

create policy "transactions_admin_write" on public.transactions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "commissions_select" on public.commissions for select to authenticated
  using (public.is_admin() or beneficiary_profile_id = auth.uid());

create policy "commissions_admin_write" on public.commissions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- plans — public pricing table, admin-managed
-- ---------------------------------------------------------------------------

create policy "plans_select_anyone" on public.plans for select to anon, authenticated using (true);
create policy "plans_admin_write" on public.plans for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- subscriptions — Stripe webhook writes via the service role (bypasses RLS);
-- direct client writes are Admin-only.
-- ---------------------------------------------------------------------------

create policy "subscriptions_select" on public.subscriptions for select to authenticated
  using (public.is_admin() or company_id = public.current_company_id());

create policy "subscriptions_admin_write" on public.subscriptions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Give7
-- ---------------------------------------------------------------------------

create policy "give7_types_select" on public.give7_types for select to authenticated using (true);

create policy "give7_referrals_select" on public.give7_referrals for select to authenticated
  using (
    public.is_admin()
    or origin_company_id = public.current_company_id()
    or destination_company_id = public.current_company_id()
    or public.is_company_in_my_region(origin_company_id)
  );

create policy "give7_referrals_insert" on public.give7_referrals for insert to authenticated
  with check (origin_company_id = public.current_company_id());
