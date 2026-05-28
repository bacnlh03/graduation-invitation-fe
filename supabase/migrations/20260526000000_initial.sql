-- Graduation invitation app — Supabase schema

create extension if not exists "pgcrypto";

-- Guests
create table public.guests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  status smallint not null default 0 check (status >= 0 and status <= 2),
  updated_at timestamptz not null default now()
);

create index guests_full_name_idx on public.guests using gin (to_tsvector('simple', full_name));
create index guests_status_idx on public.guests (status);

-- Invitation design (singleton row)
create table public.invitation_config (
  id text primary key default 'default',
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.invitation_config (id, config) values ('default', '{}'::jsonb)
on conflict (id) do nothing;

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger guests_set_updated_at
  before update on public.guests
  for each row execute function public.set_updated_at();

create trigger invitation_config_set_updated_at
  before update on public.invitation_config
  for each row execute function public.set_updated_at();

-- Public RPC: fetch one guest for invitation page (no list leak)
create or replace function public.get_guest_public(guest_id uuid)
returns table (
  id uuid,
  full_name text,
  status smallint,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select g.id, g.full_name, g.status, g.updated_at
  from public.guests g
  where g.id = guest_id;
$$;

-- Public RPC: confirm attendance (status = 2)
create or replace function public.confirm_guest_attendance(guest_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.guests
  set status = 2
  where id = guest_id;
end;
$$;

grant execute on function public.get_guest_public(uuid) to anon, authenticated;
grant execute on function public.confirm_guest_attendance(uuid) to anon, authenticated;

-- RLS
alter table public.guests enable row level security;
alter table public.invitation_config enable row level security;

create policy "Authenticated manage guests"
  on public.guests
  for all
  to authenticated
  using (true)
  with check (true);

create policy "Public read invitation config"
  on public.invitation_config
  for select
  to anon, authenticated
  using (true);

create policy "Authenticated manage invitation config"
  on public.invitation_config
  for all
  to authenticated
  using (true)
  with check (true);

-- Storage bucket for design assets
insert into storage.buckets (id, name, public)
values ('invitation-assets', 'invitation-assets', true)
on conflict (id) do nothing;

create policy "Public read invitation assets"
  on storage.objects
  for select
  to public
  using (bucket_id = 'invitation-assets');

create policy "Authenticated upload invitation assets"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'invitation-assets');

create policy "Authenticated update invitation assets"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'invitation-assets');

create policy "Authenticated delete invitation assets"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'invitation-assets');
