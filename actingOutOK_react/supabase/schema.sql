-- Acting Out OK – Supabase schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- If you already ran this once and only need to add contact_submissions, run just
-- the "CONTACT SUBMISSIONS" block (create table + comment + alter enable row level security).

-- =============================================================================
-- CAST (Talent directory)
-- =============================================================================
create table if not exists public.cast (
  id text primary key,
  name text not null,
  pronouns text,
  description text,
  location text,
  link text,
  contact_link text,
  contact_label text,
  email text,
  instagram text,
  other_links jsonb default '[]',
  tmdb_person_id integer,
  photo_url text,
  credits jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.cast is 'Talent/Cast directory entries (was directory.json Talent section).';
comment on column public.cast.credits is 'JSON: { film?, theatre?, training?, television? } each array of { projectName, characterOrRole, directorOrStudio }';
comment on column public.cast.other_links is 'Array of { label, url }';

-- =============================================================================
-- CREW (Crew directory by section)
-- =============================================================================
create table if not exists public.crew (
  id text not null,
  section text not null,
  name text not null,
  pronouns text,
  description text,
  location text,
  link text,
  contact_link text,
  contact_label text,
  pills jsonb default '[]',
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (section, id)
);

comment on table public.crew is 'Crew directory entries by section (Camera Operators, PAs, etc.).';

-- =============================================================================
-- RESOURCES (Agencies, classes, theaters, etc.)
-- =============================================================================
create table if not exists public.resources (
  id text not null,
  section text not null,
  title text not null,
  type text,
  subcategory text,
  description text,
  location text,
  link text,
  imdb_link text,
  vendor boolean default false,
  pills jsonb default '[]',
  schedule text,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (section, id)
);

comment on table public.resources is 'Resources by section (Agencies, Classes & Workshops, etc.).';

-- =============================================================================
-- CASTING CALLS (list + detail in one table)
-- =============================================================================
create table if not exists public.casting_calls (
  slug text primary key,
  title text not null,
  date date,
  audition_deadline date,
  location text,
  pay text,
  type text,
  union_status text,
  under18 boolean default false,
  role_count integer default 0,
  archived boolean default false,
  description text,
  director text,
  filming_dates text,
  submission_details text,
  source_link text,
  exclusive boolean default false,
  roles jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.casting_calls is 'Casting call list + detail. roles = array of { roleTitle, description, pay, ageRange, type, union, gender, ethnicity }';

-- =============================================================================
-- CONTACT SUBMISSIONS (contact form: general, casting, news, resource, report)
-- =============================================================================
create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  email text not null,
  type text not null,
  payload jsonb default '{}'
);

comment on table public.contact_submissions is 'Contact form submissions; payload holds type-specific fields. Emails sent via Resend.';
comment on column public.contact_submissions.type is 'One of: casting_call, news, resource, report_issue, general';
comment on column public.contact_submissions.payload is 'Type-specific form data (no turnstile token or TOS).';

-- =============================================================================
-- RLS (Row Level Security)
-- Allow public read; write only via service_role (your API uses service role).
-- =============================================================================
alter table public.cast enable row level security;
alter table public.crew enable row level security;
alter table public.resources enable row level security;
alter table public.casting_calls enable row level security;
alter table public.contact_submissions enable row level security;

-- Allow anyone to read (anon and authenticated). Create only if missing (safe to re-run).
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'cast' and policyname = 'cast_select') then
    create policy "cast_select" on public.cast for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'crew' and policyname = 'crew_select') then
    create policy "crew_select" on public.crew for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'resources' and policyname = 'resources_select') then
    create policy "resources_select" on public.resources for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'casting_calls' and policyname = 'casting_calls_select') then
    create policy "casting_calls_select" on public.casting_calls for select using (true);
  end if;
end $$;

-- contact_submissions: no public read/write; only service_role (server) can insert/select.
-- (Do not create policies for anon/auth – server uses service role which bypasses RLS.)

-- No insert/update/delete for anon or authenticated; only service_role can write.
-- (Do not create policies for insert/update/delete – your app uses the service role key server-side.)

-- =============================================================================
-- Optional: updated_at trigger
-- =============================================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers only if missing (safe to re-run).
do $$
begin
  if not exists (select 1 from pg_trigger t join pg_class c on t.tgrelid = c.oid join pg_namespace n on c.relnamespace = n.oid where n.nspname = 'public' and c.relname = 'cast' and t.tgname = 'cast_updated_at') then
    create trigger cast_updated_at before update on public.cast for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger t join pg_class c on t.tgrelid = c.oid join pg_namespace n on c.relnamespace = n.oid where n.nspname = 'public' and c.relname = 'crew' and t.tgname = 'crew_updated_at') then
    create trigger crew_updated_at before update on public.crew for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger t join pg_class c on t.tgrelid = c.oid join pg_namespace n on c.relnamespace = n.oid where n.nspname = 'public' and c.relname = 'resources' and t.tgname = 'resources_updated_at') then
    create trigger resources_updated_at before update on public.resources for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger t join pg_class c on t.tgrelid = c.oid join pg_namespace n on c.relnamespace = n.oid where n.nspname = 'public' and c.relname = 'casting_calls' and t.tgname = 'casting_calls_updated_at') then
    create trigger casting_calls_updated_at before update on public.casting_calls for each row execute function public.set_updated_at();
  end if;
end $$;

-- contact_submissions has no updated_at (append-only).
