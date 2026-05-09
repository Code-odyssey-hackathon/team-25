import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * POST /api/engineer/tasks
 * Creates a new task.
 */
export async function POST(request) {
  try {
    const taskData = await request.json();
    console.log('API: Creating task with data:', taskData);
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from('engineer_tasks')
      .insert({
        ...taskData,
        status: 'OPEN'
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase Task Insert Error:', error);
      return NextResponse.json({ error: error.message, detail: error.details, hint: error.hint }, { status: 400 });
    }

    return NextResponse.json({ task: data });
  } catch (error) {
    console.error('API Task Route Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/engineer/tasks?engineerId=xxx
 * Fetches all tasks assigned to a specific engineer.
 * Uses service role to bypass RLS.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const engineerId = searchParams.get('engineerId');
    const authorityId = searchParams.get('authorityId');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    let query = supabase.from('engineer_tasks').select(`
      *,
      assigned_to:engineers(id, name, specialization),
      report:reports(location_name, issue_type, severity, description)
    `);

    if (engineerId) {
      query = query.eq('assigned_to', engineerId);
    } else if (authorityId) {
      query = query.eq('assigned_by', authorityId);
    } else {
      return NextResponse.json({ error: 'Missing engineerId or authorityId' }, { status: 400 });
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ tasks: data || [] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/engineer/tasks
 * Updates a task's status and completion notes.
 * Uses service role to bypass RLS.
 */
export async function PATCH(request) {
  try {
    const { taskId, status, completionNotes } = await request.json();

    if (!taskId || !status) {
      return NextResponse.json({ error: 'Missing taskId or status' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const updates = { status };
    if (completionNotes) updates.completion_notes = completionNotes;
    if (status === 'COMPLETED') updates.completed_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('engineer_tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ task: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
