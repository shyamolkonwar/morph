-- MorphV2 Async Jobs & Render Assets Migration
-- Adds tables for Celery job tracking and rendered asset storage
-- Run with: supabase db push or directly in SQL Editor
-- Date: 2026-01-14

-- ============================================
-- 1. PROJECTS TABLE (Base Schema)
-- ============================================
-- Creates projects table if it doesn't exist (v1 compatibility)

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null default 'Untitled Project',
  description text,
  status text default 'draft' check (status in ('draft', 'generating', 'completed', 'failed')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- RLS for projects
alter table projects enable row level security;

create policy if not exists "projects_select_own" on projects
  for select using (auth.uid() = user_id);

create policy if not exists "projects_insert_own" on projects
  for insert with check (auth.uid() = user_id);

create policy if not exists "projects_update_own" on projects
  for update using (auth.uid() = user_id);


-- ============================================
-- 2. GENERATIONS TABLE (Base Schema)
-- ============================================
-- Creates generations table if it doesn't exist

create table if not exists generations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  user_prompt text not null,
  canvas_width int default 1200,
  canvas_height int default 630,
  brand_colors text[] default array['#FF6B35', '#FFFFFF', '#004E89'],
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- RLS for generations (inherits from projects)
alter table generations enable row level security;

create policy if not exists "generations_select_own" on generations
  for select using (
    exists (select 1 from projects p where p.id = generations.project_id and p.user_id = auth.uid())
  );

create policy if not exists "generations_insert_own" on generations
  for insert with check (
    exists (select 1 from projects p where p.id = generations.project_id and p.user_id = auth.uid())
  );


-- ============================================
-- 3. ASYNC_JOBS TABLE (Celery Job Tracking)
-- ============================================
-- Tracks async generation jobs submitted to Celery
-- Reference: docs/upstash.txt "Fire and Forget" pattern

create table if not exists async_jobs (
  id uuid primary key default gen_random_uuid(),
  
  -- Celery task ID (returned by .apply_async())
  celery_task_id text unique not null,
  
  -- Link to generation (nullable until created)
  generation_id uuid references generations(id) on delete set null,
  
  -- Link to user
  user_id uuid references auth.users(id) on delete cascade,
  
  -- Job metadata
  task_name text not null, -- e.g., 'orchestrate_design_generation'
  queue_name text default 'generation',
  
  -- Job status (mirrors Celery states)
  status text default 'PENDING' check (
    status in ('PENDING', 'STARTED', 'PROGRESS', 'SUCCESS', 'FAILURE', 'REVOKED', 'RETRY')
  ),
  
  -- Progress tracking (0-100)
  progress int default 0 check (progress >= 0 and progress <= 100),
  current_step text, -- e.g., 'Generating constraint graph...'
  
  -- Input parameters (for retry/debugging)
  input_params jsonb,
  
  -- Result or error
  result jsonb,
  error_message text,
  
  -- Timing
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Indexes for fast lookup
create index if not exists async_jobs_celery_task_idx on async_jobs (celery_task_id);
create index if not exists async_jobs_user_idx on async_jobs (user_id);
create index if not exists async_jobs_status_idx on async_jobs (status);
create index if not exists async_jobs_created_idx on async_jobs (created_at desc);

-- RLS for async_jobs
alter table async_jobs enable row level security;

create policy if not exists "async_jobs_select_own" on async_jobs
  for select using (auth.uid() = user_id);

create policy if not exists "async_jobs_insert_service" on async_jobs
  for insert with check (auth.role() = 'service_role' or auth.uid() = user_id);


-- ============================================
-- 4. RENDER_ASSETS TABLE (Output Storage)
-- ============================================
-- Stores references to rendered assets (S3/Supabase Storage)
-- Reference: Architecture "Rendered Assets (S3)"

create table if not exists render_assets (
  id uuid primary key default gen_random_uuid(),
  
  -- Link to generation
  generation_id uuid references generations(id) on delete cascade not null,
  
  -- Asset type
  asset_type text not null check (
    asset_type in ('svg', 'png', 'webp', 'pdf', 'thumbnail', 'preview')
  ),
  
  -- Storage location
  storage_path text not null, -- e.g., 'renders/uuid/output.png'
  storage_bucket text default 'render-assets',
  public_url text, -- CDN-accessible URL
  
  -- File metadata
  file_size_bytes int,
  mime_type text,
  width int,
  height int,
  
  -- For thumbnails/previews
  is_primary boolean default false,
  
  created_at timestamp with time zone default now()
);

-- Indexes
create index if not exists render_assets_generation_idx on render_assets (generation_id);
create index if not exists render_assets_type_idx on render_assets (generation_id, asset_type);

-- RLS for render_assets (inherits from generations)
alter table render_assets enable row level security;

create policy if not exists "render_assets_select_own" on render_assets
  for select using (
    exists (
      select 1 from generations g
      join projects p on g.project_id = p.id
      where g.id = render_assets.generation_id
      and p.user_id = auth.uid()
    )
  );


-- ============================================
-- 5. HELPER FUNCTIONS
-- ============================================

-- Update job status (called by Celery worker)
create or replace function update_job_status(
  p_celery_task_id text,
  p_status text,
  p_progress int default null,
  p_current_step text default null,
  p_result jsonb default null,
  p_error_message text default null
) returns void language plpgsql security definer as $$
begin
  update async_jobs
  set 
    status = p_status,
    progress = coalesce(p_progress, progress),
    current_step = coalesce(p_current_step, current_step),
    result = coalesce(p_result, result),
    error_message = coalesce(p_error_message, error_message),
    started_at = case 
      when p_status = 'STARTED' and started_at is null then now()
      else started_at
    end,
    completed_at = case 
      when p_status in ('SUCCESS', 'FAILURE', 'REVOKED') then now()
      else completed_at
    end
  where celery_task_id = p_celery_task_id;
end;
$$;

-- Get job with all related data
create or replace function get_job_details(p_celery_task_id text)
returns json language plpgsql stable as $$
declare
  result json;
begin
  select json_build_object(
    'job', row_to_json(j),
    'generation', row_to_json(g),
    'assets', (
      select json_agg(row_to_json(a))
      from render_assets a
      where a.generation_id = j.generation_id
    )
  ) into result
  from async_jobs j
  left join generations g on j.generation_id = g.id
  where j.celery_task_id = p_celery_task_id;
  
  return result;
end;
$$;


-- ============================================
-- 6. ADD MISSING COLUMNS TO GENERATIONS
-- ============================================
-- Ensure all required columns exist from architecture

do $$
begin
  -- Add canvas dimensions if missing
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'generations' and column_name = 'canvas_width'
  ) then
    alter table generations add column canvas_width int default 1200;
  end if;
  
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'generations' and column_name = 'canvas_height'
  ) then
    alter table generations add column canvas_height int default 630;
  end if;
  
  -- Add brand colors
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'generations' and column_name = 'brand_colors'
  ) then
    alter table generations add column brand_colors text[] default array['#FF6B35', '#FFFFFF', '#004E89'];
  end if;
  
  -- Add async job reference
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'generations' and column_name = 'async_job_id'
  ) then
    alter table generations add column async_job_id uuid references async_jobs(id);
  end if;
  
  -- Add total time tracking
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'generations' and column_name = 'total_time_ms'
  ) then
    alter table generations add column total_time_ms float;
  end if;
end $$;


-- ============================================
-- 7. UPDATED_AT TRIGGER
-- ============================================
-- Auto-update updated_at on row changes

create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$;

-- Apply to projects
drop trigger if exists projects_updated_at on projects;
create trigger projects_updated_at
  before update on projects
  for each row execute function update_updated_at_column();

-- Apply to generations
drop trigger if exists generations_updated_at on generations;
create trigger generations_updated_at
  before update on generations
  for each row execute function update_updated_at_column();
