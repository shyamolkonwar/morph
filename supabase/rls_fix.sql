-- Morph Database RLS Fix
-- Enables Row Level Security on system_config and suspicious_activity tables
-- Run this in Supabase SQL Editor after schema.sql

-- ============================================
-- ENABLE RLS ON SYSTEM_CONFIG
-- ============================================

ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- System config is read-only for all authenticated users
-- Only service role can modify it
CREATE POLICY "Anyone can read system config"
  ON system_config FOR SELECT
  USING (true);

-- No INSERT/UPDATE/DELETE policies for regular users
-- Only the service role (server-side) can modify system_config

-- ============================================
-- ENABLE RLS ON SUSPICIOUS_ACTIVITY
-- ============================================

ALTER TABLE suspicious_activity ENABLE ROW LEVEL SECURITY;

-- Users cannot access suspicious_activity directly
-- Only the service role (server-side) can read/write
-- This keeps abuse detection data private

-- No policies = no access for authenticated users
-- Only service role can insert/read suspicious activity logs
