-- Table: generations
-- Stores one row per image generation for analytics and history.
-- Run this in the Supabase SQL Editor (or via Supabase CLI) if you don't use migrations.

create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  famous_slug text not null,
  prompt text,
  created_at timestamptz not null default now()
);

-- Indexes for common queries
create index if not exists idx_generations_profile_id on public.generations(profile_id);
create index if not exists idx_generations_famous_slug on public.generations(famous_slug);
create index if not exists idx_generations_created_at on public.generations(created_at desc);

-- RLS: only service role (backend API) can access. Data API with anon key cannot read/write.
alter table public.generations enable row level security;

-- No policies for anon/authenticated = no access via Data API from client.
-- Service role key (used in API routes) bypasses RLS and keeps full access.

comment on table public.generations is 'One row per AI image generation (user + famous person)';
comment on column public.generations.profile_id is 'References profiles.id (user who generated)';
comment on column public.generations.famous_slug is 'Slug of the famous person (e.g. neymar)';
comment on column public.generations.prompt is 'Optional user text prompt for the generation';
