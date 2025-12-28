-- Morph Database Schema v2.0
-- Includes: Credit System, Daily Allowance, Anti-Abuse, System Config
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- SYSTEM CONFIGURATION TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  value INTEGER NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default configuration
INSERT INTO system_config (key, value, description) VALUES
  ('free_tier_daily_limit', 5, 'Number of generations allowed per day for free users'),
  ('pro_tier_daily_limit', 100, 'Number of generations allowed per day for pro users'),
  ('max_prompt_length', 500, 'Maximum characters allowed in a prompt'),
  ('speed_limit_seconds', 10, 'Minimum seconds between generation requests'),
  ('max_accounts_per_device', 3, 'Maximum accounts allowed per device fingerprint')
ON CONFLICT (key) DO NOTHING;

-- Add maintenance mode flag
INSERT INTO system_config (key, value, description) VALUES
  ('maintenance_mode', 0, 'Set to 1 to enable global maintenance mode')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- USERS TABLE (Public Mirror of auth.users)
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'team')),
  credits_balance INTEGER NOT NULL DEFAULT 5,
  daily_usage_count INTEGER NOT NULL DEFAULT 0,
  last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_banned BOOLEAN NOT NULL DEFAULT FALSE,
  ban_reason TEXT,
  device_fingerprints TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CREDIT TRANSACTIONS (Ledger Style)
-- ============================================

CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL, -- Negative for usage, positive for purchase/refund
  type TEXT NOT NULL CHECK (type IN ('generation', 'purchase', 'signup_bonus', 'refund', 'daily_reset', 'promo')),
  description TEXT,
  generation_id UUID, -- Link to the generation if applicable
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PROJECTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('linkedin_carousel', 'linkedin_banner', 'youtube_thumbnail', 'instagram_post', 'twitter_post')),
  status TEXT NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- GENERATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  prompt TEXT NOT NULL,
  copy_json JSONB,
  image_url TEXT,
  final_output_url TEXT,
  layout_id TEXT,
  platform TEXT NOT NULL,
  morph_engine_version TEXT DEFAULT '1.0-beta',
  generation_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- WAITLIST TABLE (Pro/Team Interest)
-- ============================================

CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  tier TEXT DEFAULT 'pro' CHECK (tier IN ('pro', 'team')),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- FEEDBACK TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'general')),
  message TEXT NOT NULL,
  generation_id UUID REFERENCES generations(id) ON DELETE SET NULL,
  email TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SUSPICIOUS ACTIVITY LOG
-- ============================================

CREATE TABLE IF NOT EXISTS suspicious_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  device_fingerprint TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Users: Can only view/update own row, CANNOT update credits_balance directly
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile (except credits)"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    -- Prevent direct credit manipulation
    credits_balance = (SELECT credits_balance FROM users WHERE id = auth.uid()) AND
    daily_usage_count = (SELECT daily_usage_count FROM users WHERE id = auth.uid())
  );

-- Credit Transactions: Users can only view their own
CREATE POLICY "Users can view own credit transactions"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Projects: Full CRUD on own projects
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Generations: View own generations
CREATE POLICY "Users can view own generations"
  ON generations FOR SELECT
  USING (auth.uid() = user_id);

-- Waitlist: Anyone can insert, no viewing
CREATE POLICY "Anyone can join waitlist"
  ON waitlist FOR INSERT
  WITH CHECK (true);

-- Feedback: Users can insert and view own
CREATE POLICY "Users can submit feedback"
  ON feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view own feedback"
  ON feedback FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-create user profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, credits_balance, tier)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    5, -- Signup bonus
    'free'
  );
  
  -- Record signup bonus transaction
  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (NEW.id, 5, 'signup_bonus', 'Welcome bonus credits');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_tier ON users(tier);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generations_project_id ON generations(project_id);
CREATE INDEX IF NOT EXISTS idx_generations_user_id ON generations(user_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_suspicious_activity_user_id ON suspicious_activity(user_id);
