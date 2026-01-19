import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Company } from '@/lib/types';

// GET - Fetch all projects (optionally filter by company)
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured() || !supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const company = searchParams.get('company') as Company | null;

    let query = supabase
      .from('projects')
      .select('*')
      .eq('archived', false)
      .order('name', { ascending: true });

    if (company) {
      query = query.eq('company', company);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err) {
    console.error('Fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

// POST - Create a new project
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured() || !supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { name, company, color }: { name: string; company: Company; color?: string } = body;

    if (!name || !company) {
      return NextResponse.json({ error: 'Name and company are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('projects')
      .insert([{ name, company, color: color || null }])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error('Create error:', err);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}

// PATCH - Update a project (archive it)
export async function PATCH(request: NextRequest) {
  if (!isSupabaseConfigured() || !supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { id, archived, name }: { id: string; archived?: boolean; name?: string } = body;

    const updates: Record<string, unknown> = {};
    if (archived !== undefined) updates.archived = archived;
    if (name !== undefined) updates.name = name;

    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Update error:', err);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}
