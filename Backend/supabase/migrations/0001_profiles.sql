-- =============================================================================
-- 0001_profiles.sql — Social Yolo identity/role source of truth
-- =============================================================================
-- Run this against your Supabase Postgres database (SQL Editor or the Supabase
-- CLI). It is idempotent and safe to re-run.
--
-- Design guarantees enforced here (not in application code):
--   * A profile row exists for every auth user (created by a trigger on signup,
--     for BOTH email/password and Google OAuth).
--   * Role is ONLY 'USER' or 'ADMIN' (CHECK constraint). New signups are ALWAYS
--     'USER' — any client-supplied role in the signup metadata is ignored.
--   * A user CANNOT change their own role: RLS blocks anon/authenticated inserts
--     & deletes, and a BEFORE UPDATE trigger rejects any role change that does
--     not come from the service role. Role escalation is therefore impossible
--     from the browser even if the user crafts a raw UPDATE.
--   * Postgres is the source of truth; Redis is only a cache elsewhere.
-- =============================================================================

-- Extensions ------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Table: public.profiles
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid        primary key references auth.users (id) on delete cascade,
  email       text,
  name        text,
  avatar_url  text,
  role        text        not null default 'USER'
                          check (role in ('USER', 'ADMIN')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is
  'Public profile + role for each auth user. Source of truth for authorization. Only USER/ADMIN roles.';

-- Index the column the backend filters/looks up by.
create index if not exists profiles_email_idx on public.profiles (email);

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;

-- A user may read ONLY their own profile row.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

-- A user may update ONLY their own profile row (e.g. name/avatar). The role
-- column is additionally protected by enforce_profile_role_immutability() below,
-- so this UPDATE cannot be used to self-escalate.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- NOTE: No INSERT or DELETE policy is defined for anon/authenticated. With RLS
-- enabled and no permissive policy, those operations are DENIED for regular
-- users. Rows are created by handle_new_user() (SECURITY DEFINER) and the
-- service role bypasses RLS for administrative reads/writes.

-- -----------------------------------------------------------------------------
-- Trigger: create a profile automatically on user signup
-- -----------------------------------------------------------------------------
-- SECURITY DEFINER so it can insert into public.profiles regardless of the
-- caller. Role is HARD-CODED to 'USER' here — signup metadata is used only for
-- display fields (name/avatar), never for role. Idempotent via ON CONFLICT.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    ),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    ),
    'USER'  -- always USER on signup; never trust client-supplied role
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Trigger: forbid self-service role changes
-- -----------------------------------------------------------------------------
-- Only the service role (used by the backend admin endpoint) may change `role`.
-- Any other caller attempting to change it — including the row's owner via the
-- authenticated client — is rejected. Non-role updates (name/avatar) are allowed.
create or replace function public.enforce_profile_role_immutability()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role'
     and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Changing role is not permitted.'
      using errcode = '42501';  -- insufficient_privilege
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_profile_role_immutability on public.profiles;
create trigger enforce_profile_role_immutability
  before update on public.profiles
  for each row
  execute function public.enforce_profile_role_immutability();

-- -----------------------------------------------------------------------------
-- Trigger: keep updated_at fresh
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- =============================================================================
-- Bootstrapping the FIRST admin (run manually, once, as the service role or in
-- the Supabase SQL editor). Never expose this to the client:
--
--   update public.profiles set role = 'ADMIN' where email = 'you@example.com';
--
-- The immutability trigger allows this because the SQL editor / service role is
-- privileged. All subsequent role grants should go through the backend admin
-- endpoint (PATCH /api/admin/profiles/:id/role).
-- =============================================================================
