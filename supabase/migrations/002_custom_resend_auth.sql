-- Run this once in Supabase SQL Editor to replace Supabase Auth login with ReturnGuard's Resend OTP login.
create extension if not exists "uuid-ossp";

alter table public.profiles alter column id set default uuid_generate_v4();
alter table public.profiles drop constraint if exists profiles_id_fkey;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_email_key' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_email_key unique (email);
  end if;
end $$;


create table if not exists public.email_otps (
  email text primary key,
  code_hash text not null,
  expires_at timestamptz not null,
  last_sent_at timestamptz not null default now(),
  attempts integer not null default 0
);

create table if not exists public.app_sessions (
  token_hash text primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.email_otps enable row level security;
alter table public.app_sessions enable row level security;

create or replace function public.request_returnguard_otp(p_email text, p_code_hash text)
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

create or replace function public.verify_returnguard_otp(p_email text, p_code_hash text, p_session_hash text, p_seller_email text)
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
