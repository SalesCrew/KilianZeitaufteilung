-- ============================================
-- Time Tracker - Supabase Database Schema
-- ============================================
-- Run this SQL in your Supabase SQL Editor:
-- https://app.supabase.com/project/YOUR_PROJECT/sql

-- Create the time_entries table
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company TEXT NOT NULL CHECK (company IN ('merchandising', 'salescre', 'inkognito')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  session_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE time_entries IS 'Stores time tracking entries for work sessions';
COMMENT ON COLUMN time_entries.company IS 'Company being worked for: merchandising, salescre, or inkognito';
COMMENT ON COLUMN time_entries.start_time IS 'When work started for this company segment';
COMMENT ON COLUMN time_entries.end_time IS 'When work ended for this company segment (null if still active)';
COMMENT ON COLUMN time_entries.session_id IS 'Groups entries from the same work session together';

-- Enable Row Level Security (RLS)
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (no auth required)
-- NOTE: For production, you should implement proper authentication
CREATE POLICY "Allow all operations" ON time_entries
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_time_entries_session ON time_entries(session_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_start_time ON time_entries(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_time_entries_company ON time_entries(company);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(DATE(start_time AT TIME ZONE 'Europe/Vienna'));

-- ============================================
-- Useful Queries
-- ============================================

-- Get all entries for today (Vienna timezone)
-- SELECT * FROM time_entries 
-- WHERE DATE(start_time AT TIME ZONE 'Europe/Vienna') = CURRENT_DATE
-- ORDER BY start_time DESC;

-- Get total time per company for a specific date
-- SELECT 
--   company,
--   SUM(EXTRACT(EPOCH FROM (COALESCE(end_time, NOW()) - start_time))) as total_seconds
-- FROM time_entries
-- WHERE DATE(start_time AT TIME ZONE 'Europe/Vienna') = '2026-01-16'
-- GROUP BY company;

-- Get daily summary for the last 7 days
-- SELECT 
--   DATE(start_time AT TIME ZONE 'Europe/Vienna') as work_date,
--   company,
--   SUM(EXTRACT(EPOCH FROM (COALESCE(end_time, NOW()) - start_time))) as total_seconds,
--   COUNT(*) as entry_count
-- FROM time_entries
-- WHERE start_time >= NOW() - INTERVAL '7 days'
-- GROUP BY work_date, company
-- ORDER BY work_date DESC, company;
