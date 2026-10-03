-- ReturnGuard AI initial schema. Run in Supabase SQL Editor.
create extension if not exists "uuid-ossp";

create type public.user_role as enum ('customer', 'seller');
create type public.return_reason as enum ('TOO_SMALL', 'TOO_LARGE', 'DAMAGED', 'DEFECTIVE', 'WRONG_ITEM', 'NOT_AS_EXPECTED', 'CHANGED_MIND', 'OTHER');
create type public.return_outcome as enum ('APPROVED', 'MORE_INFO_REQUIRED', 'SELLER_REVIEW', 'NOT_ELIGIBLE');
create type public.return_status as enum ('REQUESTED', 'MORE_INFO_REQUIRED', 'UNDER_REVIEW', 'APPROVED', 'RETURNING', 'RECEIVED', 'REFUNDED', 'COMPLETED', 'REJECTED');
create type public.risk_level as enum ('LOW', 'MEDIUM', 'HIGH');

create table public.profiles (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  full_name text,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now()
);

create table public.stores (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  return_window_days integer not null default 30,
  auto_approval_limit numeric(10,2) not null default 5000,
  created_at timestamptz not null default now()
);

create table public.store_members (
  store_id uuid not null references public.stores(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.user_role not null default 'seller',
  primary key (store_id, profile_id)
);

create table public.products (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  category text,
  price numeric(10,2) not null,
  image_url text,
  is_final_sale boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  display_id text not null unique,
  store_id uuid not null references public.stores(id) on delete cascade,
  customer_id uuid not null references public.profiles(id),
  status text not null default 'DELIVERED',
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(10,2) not null
);

create table public.return_cases (
  id uuid primary key default uuid_generate_v4(),
  display_id text not null unique,
  order_item_id uuid not null references public.order_items(id),
  customer_id uuid not null references public.profiles(id),
  requested_resolution text not null check (requested_resolution in ('refund', 'replacement', 'exchange')),
  customer_message text,
  reason public.return_reason not null,
  outcome public.return_outcome,
  status public.return_status not null default 'REQUESTED',
  risk_level public.risk_level not null default 'LOW',
  policy_result text,
  ai_summary text,
  evidence_assessment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.return_evidence (
  id uuid primary key default uuid_generate_v4(),
  return_case_id uuid not null references public.return_cases(id) on delete cascade,
  storage_path text not null,
  mime_type text not null default 'image/jpeg',
  assessment text,
  created_at timestamptz not null default now()
);

create table public.return_events (
  id uuid primary key default uuid_generate_v4(),
  return_case_id uuid not null references public.return_cases(id) on delete cascade,
  status public.return_status not null,
  message text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.return_cases enable row level security;
alter table public.return_evidence enable row level security;
alter table public.return_events enable row level security;
alter table public.store_members enable row level security;
alter table public.return_evidence enable row level security;

create policy "customers read own profile" on public.profiles for select using (auth.uid() = id);
create policy "customers read own orders" on public.orders for select using (auth.uid() = customer_id);
create policy "customers read items of own orders" on public.order_items for select using (exists (select 1 from public.orders where orders.id = order_items.order_id and orders.customer_id = auth.uid()));
create policy "customers read own returns" on public.return_cases for select using (auth.uid() = customer_id);
create policy "customers create own returns" on public.return_cases for insert with check (
  auth.uid() = customer_id and exists (
    select 1 from public.order_items oi join public.orders o on o.id = oi.order_id
    where oi.id = return_cases.order_item_id and o.customer_id = auth.uid()
  )
);
create policy "customers read own return events" on public.return_events for select using (
  exists (select 1 from public.return_cases rc where rc.id = return_events.return_case_id and rc.customer_id = auth.uid())
);
create policy "customers read own evidence" on public.return_evidence for select using (
  exists (select 1 from public.return_cases rc where rc.id = return_evidence.return_case_id and rc.customer_id = auth.uid())
);
create policy "customers insert own evidence" on public.return_evidence for insert with check (
  exists (select 1 from public.return_cases rc where rc.id = return_evidence.return_case_id and rc.customer_id = auth.uid())
);

create policy "sellers read their store returns" on public.return_cases for select using (
  exists (
    select 1 from public.order_items oi join public.orders o on o.id = oi.order_id
    join public.store_members sm on sm.store_id = o.store_id
    where oi.id = return_cases.order_item_id and sm.profile_id = auth.uid() and sm.role = 'seller'
  )
);
create policy "sellers update their store returns" on public.return_cases for update using (
  exists (
    select 1 from public.order_items oi join public.orders o on o.id = oi.order_id
    join public.store_members sm on sm.store_id = o.store_id
    where oi.id = return_cases.order_item_id and sm.profile_id = auth.uid() and sm.role = 'seller'
  )
);

create table public.email_otps (
  email text primary key,
  code_hash text not null,
  expires_at timestamptz not null,
  last_sent_at timestamptz not null default now(),
  attempts integer not null default 0
);

create table public.app_sessions (
  token_hash text primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.email_otps enable row level security;
alter table public.app_sessions enable row level security;

create function public.request_returnguard_otp(p_email text, p_code_hash text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.email_otps where email = lower(trim(p_email)) and last_sent_at > now() - interval '60 seconds') then
    raise exception 'Please wait before requesting another code.';
  end if;
  insert into public.email_otps (email, code_hash, expires_at, last_sent_at, attempts)
  values (lower(trim(p_email)), p_code_hash, now() + interval '10 minutes', now(), 0)
  on conflict (email) do update set code_hash = excluded.code_hash, expires_at = excluded.expires_at, last_sent_at = now(), attempts = 0;
end;
$$;

create function public.verify_returnguard_otp(p_email text, p_code_hash text, p_session_hash text, p_seller_email text)
returns table(profile_id uuid, role public.user_role)
language plpgsql security definer set search_path = public as $$
declare current_otp public.email_otps; verified_profile public.profiles;
begin
  select * into current_otp from public.email_otps where email = lower(trim(p_email)) for update;
  if current_otp is null or current_otp.expires_at < now() or current_otp.attempts >= 5 or current_otp.code_hash <> p_code_hash then
    update public.email_otps set attempts = attempts + 1 where email = lower(trim(p_email));
    raise exception 'Invalid or expired verification code.';
  end if;
  insert into public.profiles (email, role)
  values (lower(trim(p_email)), case when lower(trim(p_email)) = lower(trim(p_seller_email)) then 'seller'::public.user_role else 'customer'::public.user_role end)
  on conflict (email) do update set role = case when excluded.email = lower(trim(p_seller_email)) then 'seller'::public.user_role else public.profiles.role end
  returning * into verified_profile;
  delete from public.email_otps where email = lower(trim(p_email));
  insert into public.app_sessions (token_hash, profile_id, expires_at) values (p_session_hash, verified_profile.id, now() + interval '7 days');
  return query select verified_profile.id, verified_profile.role;
end;
$$;

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger return_cases_set_updated_at
  before update on public.return_cases
  for each row execute procedure public.set_updated_at();

insert into storage.buckets (id, name, public)
values ('return-evidence', 'return-evidence', false)
on conflict (id) do nothing;

create policy "customers upload their return evidence"
on storage.objects for insert to authenticated
with check (bucket_id = 'return-evidence' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "customers read their return evidence"
on storage.objects for select to authenticated
using (bucket_id = 'return-evidence' and (storage.foldername(name))[1] = (select auth.uid()::text));

-- Add one `store_members` row for the seller after creating a store.
-- Store uploaded evidence in a private `return-evidence` bucket and expose it through signed URLs only.
