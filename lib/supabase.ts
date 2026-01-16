import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create client only if credentials are available
let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey && 
    supabaseUrl !== 'your_supabase_project_url' && 
    supabaseAnonKey !== 'your_supabase_anon_key') {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };

export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}

// SQL to create the table in Supabase:
/*
CREATE TABLE time_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company TEXT NOT NULL CHECK (company IN ('merchandising', 'salescre', 'inkognito')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  session_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS but allow public access (no auth)
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON time_entries
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_time_entries_session ON time_entries(session_id);
CREATE INDEX idx_time_entries_start_time ON time_entries(start_time DESC);
*/
