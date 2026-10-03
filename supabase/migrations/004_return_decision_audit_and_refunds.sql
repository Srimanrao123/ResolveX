-- Durable audit data for AI-assisted return decisions and the manual refund workflow.
alter table public.return_cases
  add column if not exists decision_reasons jsonb not null default '[]'::jsonb,
  add column if not exists ai_evidence_observation text,
  add column if not exists ai_evidence_source text,
  add column if not exists ai_model text,
  add column if not exists image_comparison jsonb,
  add column if not exists seller_decision_note text,
  add column if not exists seller_decided_at timestamptz;

create table if not exists public.refunds (
  id uuid primary key default uuid_generate_v4(),
  return_case_id uuid not null unique references public.return_cases(id) on delete cascade,
  amount numeric(10,2) not null check (amount >= 0),
  status text not null check (status in ('PENDING_MANUAL', 'REFUNDED', 'FAILED', 'CANCELLED')),
  provider text not null default 'manual',
  provider_reference text,
  note text,
  initiated_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists refunds_return_case_id_idx on public.refunds(return_case_id);
alter table public.refunds enable row level security;

drop policy if exists "customers read own refunds" on public.refunds;
create policy "customers read own refunds" on public.refunds for select using (
  exists (select 1 from public.return_cases rc where rc.id = refunds.return_case_id and rc.customer_id = auth.uid())
);
