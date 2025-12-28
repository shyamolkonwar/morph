-- Fix RLS policies for credit system
-- Run this in Supabase SQL Editor

-- Drop existing restrictive policies on users table if they exist
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can update own daily usage" ON users;

-- Allow users to update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow users to read their own data
DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow service role to do anything (for server-side operations)
DROP POLICY IF EXISTS "Service role has full access" ON users;
CREATE POLICY "Service role has full access"
  ON users FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Fix credit_transactions policies
DROP POLICY IF EXISTS "Users can insert own transactions" ON credit_transactions;
CREATE POLICY "Users can insert own transactions"
  ON credit_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own transactions" ON credit_transactions;
CREATE POLICY "Users can read own transactions"
  ON credit_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Fix projects policies
DROP POLICY IF EXISTS "Users can manage own projects" ON projects;
CREATE POLICY "Users can manage own projects"
  ON projects FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fix generations policies
DROP POLICY IF EXISTS "Users can manage own generations" ON generations;
CREATE POLICY "Users can manage own generations"
  ON generations FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Verify policies are in place
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'credit_transactions', 'projects', 'generations');
