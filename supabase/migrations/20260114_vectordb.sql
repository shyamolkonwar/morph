-- MorphV2 Vector Database Migration
-- Enables pgvector for semantic design pattern search
-- Run with: supabase db push or directly in SQL Editor

-- ============================================
-- 1. ENABLE VECTOR EXTENSION
-- ============================================

create extension if not exists vector;

-- ============================================
-- 2. DESIGN PATTERNS TABLE (Vector Layer)
-- ============================================
-- Stores design embeddings for RAG retrieval
-- Reference: "100k+ design examples, semantic search"

create table if not exists design_patterns (
  id uuid primary key default gen_random_uuid(),
  
  -- Vector embedding (OpenAI text-embedding-3-small = 1536 dimensions)
  embedding vector(1536),
  
  -- Design content (constraint graph JSON or description)
  content text not null,
  
  -- Structured metadata for filtering
  -- e.g., {"style": "minimalist", "industry": "tech", "platform": "linkedin"}
  metadata jsonb default '{}',
  
  -- Design category for quick filtering
  category text,
  
  -- Source of the pattern (e.g., "rico", "pinterest", "generated")
  source text default 'generated',
  
  -- Usage count for popularity ranking
  usage_count int default 0,
  
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- HNSW index for fast similarity search (critical for 100k+ rows)
create index if not exists design_patterns_embedding_idx 
  on design_patterns 
  using hnsw (embedding vector_cosine_ops);

-- Index for metadata filtering
create index if not exists design_patterns_category_idx 
  on design_patterns (category);

create index if not exists design_patterns_metadata_idx 
  on design_patterns 
  using gin (metadata);


-- ============================================
-- 3. SEMANTIC SEARCH FUNCTION (RPC)
-- ============================================
-- Query: "Find 5 layouts for a Medical Student banner"

create or replace function match_design_patterns(
  query_embedding vector(1536),
  match_threshold float default 0.5,
  match_count int default 5,
  filter_metadata jsonb default '{}'
) returns table (
  id uuid,
  content text,
  metadata jsonb,
  category text,
  similarity float
) language plpgsql stable as $$
begin
  return query (
    select
      dp.id,
      dp.content,
      dp.metadata,
      dp.category,
      1 - (dp.embedding <=> query_embedding) as similarity
    from design_patterns dp
    where 1 - (dp.embedding <=> query_embedding) > match_threshold
    -- JSONB containment for metadata filtering
    and dp.metadata @> filter_metadata
    order by dp.embedding <=> query_embedding
    limit match_count
  );
end;
$$;


-- ============================================
-- 4. ENHANCED GENERATIONS TABLE
-- ============================================
-- Stores the full design pipeline state

-- First, add new columns to existing generations table if they don't exist
do $$
begin
  -- Add design_intent column
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'generations' and column_name = 'design_intent'
  ) then
    alter table generations add column design_intent jsonb;
  end if;
  
  -- Add constraint_graph column
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'generations' and column_name = 'constraint_graph'
  ) then
    alter table generations add column constraint_graph jsonb;
  end if;
  
  -- Add svg_output column
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'generations' and column_name = 'svg_output'
  ) then
    alter table generations add column svg_output text;
  end if;
  
  -- Add verification_status column
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'generations' and column_name = 'verification_status'
  ) then
    alter table generations add column verification_status text default 'pending';
  end if;
  
  -- Add verification_report column
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'generations' and column_name = 'verification_report'
  ) then
    alter table generations add column verification_report jsonb;
  end if;
  
  -- Add iteration_count column
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'generations' and column_name = 'iteration_count'
  ) then
    alter table generations add column iteration_count int default 1;
  end if;
  
  -- Add retrieved_patterns column (RAG references)
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'generations' and column_name = 'retrieved_patterns'
  ) then
    alter table generations add column retrieved_patterns uuid[];
  end if;
end $$;


-- ============================================
-- 5. REFINEMENT AUDIT LOGS TABLE
-- ============================================
-- Tracks the iterative refinement loop

create table if not exists refinement_audit_logs (
  id uuid primary key default gen_random_uuid(),
  
  -- Link to generation
  generation_id uuid references generations(id) on delete cascade,
  
  -- Iteration number (1, 2, 3...)
  iteration_number int not null,
  
  -- What failed in verification?
  -- e.g., {"layer": "contrast", "error": "Ratio 3.1 < 4.5"}
  verification_errors jsonb,
  
  -- What action did the agent take?
  agent_action text,
  
  -- The SVG before this iteration
  svg_before text,
  
  -- The SVG after correction
  svg_after text,
  
  -- Time taken for this iteration (ms)
  duration_ms int,
  
  created_at timestamp with time zone default now()
);

-- Index for fast lookup by generation
create index if not exists refinement_logs_generation_idx 
  on refinement_audit_logs (generation_id);

create index if not exists refinement_logs_iteration_idx 
  on refinement_audit_logs (generation_id, iteration_number);


-- ============================================
-- 6. RLS POLICIES
-- ============================================

-- Design patterns are readable by all authenticated users
alter table design_patterns enable row level security;

create policy "design_patterns_select_all" on design_patterns
  for select
  using (true);

-- Only service role can insert/update patterns
create policy "design_patterns_insert_service" on design_patterns
  for insert
  with check (auth.role() = 'service_role');

-- Audit logs inherit from generations policy
alter table refinement_audit_logs enable row level security;

create policy "audit_logs_select_own" on refinement_audit_logs
  for select
  using (
    exists (
      select 1 from generations g
      join projects p on g.project_id = p.id
      where g.id = refinement_audit_logs.generation_id
      and p.user_id = auth.uid()
    )
  );


-- ============================================
-- 7. HELPER FUNCTIONS
-- ============================================

-- Increment pattern usage count
create or replace function increment_pattern_usage(pattern_id uuid)
returns void language plpgsql security definer as $$
begin
  update design_patterns
  set usage_count = usage_count + 1,
      updated_at = now()
  where id = pattern_id;
end;
$$;

-- Get generation with full audit history
create or replace function get_generation_with_history(gen_id uuid)
returns json language plpgsql stable as $$
declare
  result json;
begin
  select json_build_object(
    'generation', row_to_json(g),
    'audit_logs', (
      select json_agg(row_to_json(l) order by l.iteration_number)
      from refinement_audit_logs l
      where l.generation_id = gen_id
    )
  ) into result
  from generations g
  where g.id = gen_id;
  
  return result;
end;
$$;
