import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * K-GRM — Engineer Action Log API
 * 
 * Records timestamped action logs for field engineers.
 * Action Types per K-GRM spec:
 *   FIELD_VISIT_INITIATED, ASSESSMENT_COMPLETE, MATERIAL_REQUESTED,
 *   WORK_STARTED, WORK_IN_PROGRESS, WORK_COMPLETE, CITIZEN_NOTIFIED, ISSUE_CLOSED
 */

const VALID_ACTION_TYPES = [
  'FIELD_VISIT_INITIATED',
  'ASSESSMENT_COMPLETE',
  'MATERIAL_REQUESTED',
  'MATERIAL_RECEIVED',
  'WORK_STARTED',
  'WORK_IN_PROGRESS',
  'WORK_COMPLETE',
  'CITIZEN_NOTIFIED',
  'ISSUE_CLOSED',
];

export async function POST(request) {
  try {
    const { task_id, engineer_id, action_type, remark, photo_url } = await request.json();

    if (!task_id || !engineer_id || !action_type) {
      return NextResponse.json(
        { error: 'task_id, engineer_id, and action_type are required' },
        { status: 400 }
      );
    }

    if (!VALID_ACTION_TYPES.includes(action_type)) {
      return NextResponse.json(
        { error: `Invalid action_type. Must be one of: ${VALID_ACTION_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Insert action log
    const { data, error } = await supabase
      .from('engineer_action_logs')
      .insert({
        task_id,
        engineer_id,
        action_type,
        remark: remark || null,
        photo_url: photo_url || null,
      })
      .select()
      .single();

    if (error) {
      // If table doesn't exist yet, return graceful error
      if (error.message.includes('does not exist') || error.code === '42P01') {
        return NextResponse.json({
          success: false,
          message: 'engineer_action_logs table not yet created. Run the K-GRM migration SQL.',
          error: error.message,
        }, { status: 503 });
      }
      throw error;
    }

    // Auto-update task status based on action type
    const statusMap = {
      'FIELD_VISIT_INITIATED': 'IN_PROGRESS',
      'WORK_STARTED': 'IN_PROGRESS',
      'WORK_IN_PROGRESS': 'IN_PROGRESS',
      'WORK_COMPLETE': 'COMPLETED',
      'ISSUE_CLOSED': 'CLOSED',
    };

    if (statusMap[action_type]) {
      await supabase
        .from('engineer_tasks')
        .update({
          status: statusMap[action_type],
          ...(action_type === 'WORK_COMPLETE' ? { completed_at: new Date().toISOString() } : {}),
        })
        .eq('id', task_id)
        .catch(console.error);
    }

    return NextResponse.json({
      success: true,
      action_log: data,
      message: `Action ${action_type} logged successfully`,
    });

  } catch (error) {
    console.error('Action log error:', error);
    return NextResponse.json({ error: 'Failed to log action', details: error.message }, { status: 500 });
  }
}

/**
 * GET — Fetch action logs for a task
 */
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const taskId = url.searchParams.get('task_id');

    if (!taskId) {
      return NextResponse.json({ error: 'task_id query parameter required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase
      .from('engineer_action_logs')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) {
      if (error.message.includes('does not exist') || error.code === '42P01') {
        return NextResponse.json({ success: true, logs: [], message: 'Table not yet created' });
      }
      throw error;
    }

    return NextResponse.json({ success: true, logs: data || [] });

  } catch (error) {
    console.error('Action log fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch logs', details: error.message }, { status: 500 });
  }
}
