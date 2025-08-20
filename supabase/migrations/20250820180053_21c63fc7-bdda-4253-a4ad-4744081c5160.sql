
-- 1) Enum for roles
create type public.app_role as enum ('manager', 'recruiter');

-- 2) Roles table: exactly one role per user
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.user_roles enable row level security;

-- 3) Helper to auto-maintain updated_at (future-proofing)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_user_roles_updated_at
before update on public.user_roles
for each row
execute procedure public.set_updated_at();

-- 4) RLS policies
-- Users can view their own role
create policy "Users can view their own role"
on public.user_roles
for select
to authenticated
using (auth.uid() = user_id);

-- Admins can view all roles
create policy "Admins can view all roles"
on public.user_roles
for select
to authenticated
using (is_admin());

-- Users can set their role once (no updates or deletes by default)
create policy "Users can set their role once"
on public.user_roles
for insert
to authenticated
with check (
  auth.uid() = user_id
  and not exists (
    select 1 from public.user_roles ur where ur.user_id = auth.uid()
  )
);

-- Admins can update/delete if needed
create policy "Admins can update roles"
on public.user_roles
for update
to authenticated
using (is_admin())
with check (is_admin());

create policy "Admins can delete roles"
on public.user_roles
for delete
to authenticated
using (is_admin());

-- 5) Convenience functions for guards/policies
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role(auth.uid(), 'manager'::public.app_role);
$$;

create or replace function public.is_recruiter()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role(auth.uid(), 'recruiter'::public.app_role);
$$;
