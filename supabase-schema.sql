-- ============================================
-- Time Tracker - Supabase Database Schema
-- ============================================
-- Run this SQL in your Supabase SQL Editor:
-- https://app.supabase.com/project/YOUR_PROJECT/sql

-- ============================================
-- INITIAL SETUP (Run once for new projects)
-- ============================================

-- Create the time_entries table
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company TEXT NOT NULL CHECK (company IN ('merchandising', 'salescrew', 'inkognito')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  session_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT NOT NULL CHECK (company IN ('merchandising', 'salescrew', 'inkognito')),
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  archived BOOLEAN DEFAULT FALSE
);

-- Add project_id column to time_entries (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'time_entries' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE time_entries ADD COLUMN project_id UUID REFERENCES projects(id);
  END IF;
END $$;

-- Add is_sick_day column to time_entries (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'time_entries' AND column_name = 'is_sick_day'
  ) THEN
    ALTER TABLE time_entries ADD COLUMN is_sick_day BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON TABLE time_entries IS 'Stores time tracking entries for work sessions';
COMMENT ON COLUMN time_entries.company IS 'Company being worked for: merchandising, salescrew, or inkognito';
COMMENT ON COLUMN time_entries.start_time IS 'When work started for this company segment';
COMMENT ON COLUMN time_entries.end_time IS 'When work ended for this company segment (null if still active)';
COMMENT ON COLUMN time_entries.session_id IS 'Groups entries from the same work session together';
COMMENT ON COLUMN time_entries.project_id IS 'Reference to the project being worked on';
COMMENT ON COLUMN time_entries.is_sick_day IS 'Whether this entry represents a sick day (Krankenstand)';

COMMENT ON TABLE projects IS 'Stores projects linked to companies';
COMMENT ON COLUMN projects.name IS 'Project name (e.g., Coca Cola, Mars)';
COMMENT ON COLUMN projects.company IS 'Parent company this project belongs to';
COMMENT ON COLUMN projects.archived IS 'Soft delete flag for hiding old projects';

-- Enable Row Level Security (RLS)
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required)
DROP POLICY IF EXISTS "Allow all operations" ON time_entries;
CREATE POLICY "Allow all operations" ON time_entries
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations" ON projects;
CREATE POLICY "Allow all operations" ON projects
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_time_entries_session ON time_entries(session_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_start_time ON time_entries(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_time_entries_company ON time_entries(company);
CREATE INDEX IF NOT EXISTS idx_time_entries_project ON time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_company ON projects(company);
CREATE INDEX IF NOT EXISTS idx_projects_archived ON projects(archived);

-- ============================================
-- Useful Queries
-- ============================================

-- Get all active projects for a company
-- SELECT * FROM projects 
-- WHERE company = 'merchandising' AND archived = FALSE
-- ORDER BY name;

-- Get time entries with project names
-- SELECT te.*, p.name as project_name 
-- FROM time_entries te
-- LEFT JOIN projects p ON te.project_id = p.id
-- ORDER BY te.start_time DESC;

-- Get total time per project for today
-- SELECT 
--   p.name as project_name,
--   te.company,
--   SUM(EXTRACT(EPOCH FROM (COALESCE(te.end_time, NOW()) - te.start_time))) as total_seconds
-- FROM time_entries te
-- LEFT JOIN projects p ON te.project_id = p.id
-- WHERE DATE(te.start_time AT TIME ZONE 'Europe/Vienna') = CURRENT_DATE
-- GROUP BY p.name, te.company;
