-- DailyFinance Pro: multi-tenant schema and authorization boundary.
create extension if not exists pgcrypto;

create type public.company_role as enum ('owner', 'manager', 'collection_agent', 'accountant', 'viewer');
create type public.membership_status as enum ('invited', 'active', 'suspended');
create type public.collection_frequency as enum ('daily', 'weekly', 'monthly');
create type public.payment_mode as enum ('cash', 'upi', 'bank_transfer', 'card', 'cheque');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  currency text not null default 'INR' check (currency = 'INR'),
  timezone text not null default 'Asia/Kolkata',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.company_memberships (
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.company_role not null,
  status public.membership_status not null default 'active',
  invited_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (company_id, user_id)
);
create index company_memberships_user_idx on public.company_memberships(user_id, status);

create table public.customers (
  id bigint generated always as identity primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_number text not null,
  full_name text not null,
  phone text not null,
  address text,
  assigned_agent_id uuid references auth.users(id),
  is_active boolean not null default true,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, customer_number)
);
create index customers_company_status_idx on public.customers(company_id, is_active);
create index customers_agent_idx on public.customers(company_id, assigned_agent_id);

create table public.chit_groups (
  id bigint generated always as identity primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  frequency public.collection_frequency not null,
  chit_value numeric(14,2) not null check (chit_value > 0),
  installment_amount numeric(14,2) not null check (installment_amount > 0),
  total_installments smallint not null check (total_installments > 0),
  capacity smallint not null check (capacity > 0),
  starts_on date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(company_id, name)
);
create index chit_groups_company_idx on public.chit_groups(company_id, is_active);

create table public.chit_members (
  id bigint generated always as identity primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  chit_group_id bigint not null references public.chit_groups(id) on delete cascade,
  customer_id bigint not null references public.customers(id) on delete restrict,
  joined_on date not null default current_date,
  installment_number smallint not null default 0 check (installment_number >= 0),
  amount_paid numeric(14,2) not null default 0 check (amount_paid >= 0),
  status text not null default 'active' check (status in ('active','completed','defaulted','cancelled')),
  unique(chit_group_id, customer_id)
);
create index chit_members_company_idx on public.chit_members(company_id, status);
create index chit_members_customer_idx on public.chit_members(customer_id);

create table public.collections (
  id bigint generated always as identity primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  chit_member_id bigint not null references public.chit_members(id) on delete restrict,
  amount numeric(14,2) not null check (amount > 0),
  payment_mode public.payment_mode not null,
  reference_number text,
  collected_by uuid not null default auth.uid() references auth.users(id),
  collected_at timestamptz not null default now(),
  notes text,
  voided_at timestamptz,
  voided_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index collections_company_date_idx on public.collections(company_id, collected_at desc) where voided_at is null;
create index collections_member_idx on public.collections(chit_member_id, collected_at desc);
create index collections_agent_idx on public.collections(company_id, collected_by, collected_at desc);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  actor_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_company_date_idx on public.audit_logs(company_id, created_at desc);

create or replace function public.is_company_member(requested_company_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.company_memberships
    where company_id = requested_company_id
      and user_id = (select auth.uid())
      and status = 'active'
  );
$$;

create or replace function public.has_company_role(requested_company_id uuid, allowed_roles public.company_role[])
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.company_memberships
    where company_id = requested_company_id
      and user_id = (select auth.uid())
      and status = 'active'
      and role = any(allowed_roles)
  );
$$;

create or replace function public.is_assigned_chit_member(requested_company_id uuid, requested_member_id bigint)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.chit_members cm
    join public.customers c on c.id = cm.customer_id and c.company_id = cm.company_id
    where cm.id = requested_member_id
      and cm.company_id = requested_company_id
      and c.assigned_agent_id = (select auth.uid())
      and public.has_company_role(requested_company_id, array['collection_agent']::public.company_role[])
  );
$$;

create or replace function public.create_company(company_name text, company_slug text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare new_company_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  insert into public.companies(name, slug, created_by)
  values (company_name, company_slug, auth.uid()) returning id into new_company_id;
  insert into public.company_memberships(company_id, user_id, role, status)
  values (new_company_id, auth.uid(), 'owner', 'active');
  return new_company_id;
end;
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.company_memberships enable row level security;
alter table public.customers enable row level security;
alter table public.chit_groups enable row level security;
alter table public.chit_members enable row level security;
alter table public.collections enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_self_select on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy profiles_company_select on public.profiles for select to authenticated using (exists (select 1 from public.company_memberships mine join public.company_memberships theirs on theirs.company_id = mine.company_id where mine.user_id = (select auth.uid()) and mine.status = 'active' and theirs.user_id = profiles.id));
create policy profiles_self_update on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy companies_member_select on public.companies for select to authenticated using ((select public.is_company_member(id)));
create policy memberships_member_select on public.company_memberships for select to authenticated using ((select public.is_company_member(company_id)));
create policy memberships_owner_update on public.company_memberships for update to authenticated
  using ((select public.has_company_role(company_id, array['owner']::public.company_role[])))
  with check ((select public.has_company_role(company_id, array['owner']::public.company_role[])));
create policy memberships_manager_update on public.company_memberships for update to authenticated
  using (role in ('collection_agent','accountant','viewer') and (select public.has_company_role(company_id, array['manager']::public.company_role[])))
  with check (role in ('collection_agent','accountant','viewer') and (select public.has_company_role(company_id, array['manager']::public.company_role[])));

create policy customers_staff_select on public.customers for select to authenticated using (
  (select public.has_company_role(company_id, array['owner','manager','accountant','viewer']::public.company_role[]))
  or (assigned_agent_id = (select auth.uid()) and (select public.has_company_role(company_id, array['collection_agent']::public.company_role[])))
);
create policy customers_manager_insert on public.customers for insert to authenticated with check ((select public.has_company_role(company_id, array['owner','manager']::public.company_role[])));
create policy customers_staff_update on public.customers for update to authenticated
  using (
    (select public.has_company_role(company_id, array['owner','manager']::public.company_role[]))
    or (assigned_agent_id = (select auth.uid()) and (select public.has_company_role(company_id, array['collection_agent']::public.company_role[])))
  )
  with check (
    (select public.has_company_role(company_id, array['owner','manager']::public.company_role[]))
    or (assigned_agent_id = (select auth.uid()) and (select public.has_company_role(company_id, array['collection_agent']::public.company_role[])))
  );

create policy groups_member_select on public.chit_groups for select to authenticated using ((select public.is_company_member(company_id)));
create policy groups_manager_write on public.chit_groups for all to authenticated using ((select public.has_company_role(company_id, array['owner','manager']::public.company_role[]))) with check ((select public.has_company_role(company_id, array['owner','manager']::public.company_role[])));
create policy chit_members_staff_select on public.chit_members for select to authenticated using (
  (select public.has_company_role(company_id, array['owner','manager','accountant','viewer']::public.company_role[]))
  or (select public.is_assigned_chit_member(company_id, id))
);
create policy chit_members_manager_write on public.chit_members for all to authenticated using ((select public.has_company_role(company_id, array['owner','manager']::public.company_role[]))) with check ((select public.has_company_role(company_id, array['owner','manager']::public.company_role[])));

create policy collections_staff_select on public.collections for select to authenticated using (
  (select public.has_company_role(company_id, array['owner','manager','accountant','viewer']::public.company_role[]))
  or (collected_by = (select auth.uid()) and (select public.has_company_role(company_id, array['collection_agent']::public.company_role[])))
);
create policy collections_agent_insert on public.collections for insert to authenticated with check (
  collected_by = (select auth.uid())
  and (
    (select public.has_company_role(company_id, array['owner','manager']::public.company_role[]))
    or (select public.is_assigned_chit_member(company_id, chit_member_id))
  )
);
create policy collections_manager_update on public.collections for update to authenticated using ((select public.has_company_role(company_id, array['owner','manager','accountant']::public.company_role[]))) with check ((select public.has_company_role(company_id, array['owner','manager','accountant']::public.company_role[])));
create policy audit_member_select on public.audit_logs for select to authenticated using ((select public.has_company_role(company_id, array['owner','manager','accountant']::public.company_role[])));
create policy audit_member_insert on public.audit_logs for insert to authenticated with check (actor_id = (select auth.uid()) and (select public.is_company_member(company_id)));

revoke all on function public.create_company(text,text) from public;
grant execute on function public.create_company(text,text) to authenticated;
revoke all on function public.is_company_member(uuid) from public;
grant execute on function public.is_company_member(uuid) to authenticated;
revoke all on function public.has_company_role(uuid,public.company_role[]) from public;
grant execute on function public.has_company_role(uuid,public.company_role[]) to authenticated;
revoke all on function public.is_assigned_chit_member(uuid,bigint) from public;
grant execute on function public.is_assigned_chit_member(uuid,bigint) to authenticated;
