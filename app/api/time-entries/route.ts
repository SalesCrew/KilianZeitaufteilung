import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Company } from '@/lib/types';

// GET - Fetch all time entries with project data
export async function GET() {
  if (!isSupabaseConfigured() || !supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  try {
    const { data, error } = await supabase
      .from('time_entries')
      .select(`
        *,
        project:projects(*)
      `)
      .order('start_time', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err) {
    console.error('Fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
  }
}

// POST - Create a new time entry
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured() || !supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { company, start_time, end_time, session_id, project_id, is_sick_day, is_home_office }: { 
      company: Company; 
      start_time: string; 
      end_time?: string;
      session_id: string;
      project_id?: string;
      is_sick_day?: boolean;
      is_home_office?: boolean;
    } = body;

    const insertData: Record<string, unknown> = {
      company,
      start_time,
      session_id,
      project_id: project_id || null,
      is_sick_day: is_sick_day || false,
      is_home_office: is_home_office || false,
    };
    if (end_time) insertData.end_time = end_time;

    const { data, error } = await supabase
      .from('time_entries')
      .insert([insertData])
      .select(`
        *,
        project:projects(*)
      `)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error('Create error:', err);
    return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 });
  }
}

// PATCH - Update a time entry (set end_time)
export async function PATCH(request: NextRequest) {
  if (!isSupabaseConfigured() || !supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { id, end_time, project_id, company, start_time, is_home_office }: {
      id: string;
      end_time?: string;
      project_id?: string;
      company?: string;
      start_time?: string;
      is_home_office?: boolean;
    } = body;

    const updates: Record<string, unknown> = {};
    if (end_time !== undefined) updates.end_time = end_time;
    if (project_id !== undefined) updates.project_id = project_id;
    if (company !== undefined) updates.company = company;
    if (start_time !== undefined) updates.start_time = start_time;
    if (is_home_office !== undefined) updates.is_home_office = is_home_office;

    const { data, error } = await supabase
      .from('time_entries')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        project:projects(*)
      `)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Update error:', err);
    return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
  }
}
