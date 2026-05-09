import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // Important: Use server-side admin client in a real app

export async function POST(request) {
  try {
    const { report_id, citizen_id } = await request.json();

    if (!report_id || !citizen_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Check if the user already upvoted
    const { data: existing, error: checkError } = await supabase
      .from('report_upvotes')
      .select('id')
      .eq('report_id', report_id)
      .eq('citizen_id', citizen_id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Check error:', checkError);
      return NextResponse.json({ error: 'Database check error' }, { status: 500 });
    }

    if (existing) {
      // User already upvoted, so we toggle (remove upvote)
      await supabase.from('report_upvotes').delete().eq('id', existing.id);
      
      // Decrement count
      // Note: Ideally use a PostgreSQL function / RPC for atomic decrement to prevent race conditions
      // e.g. await supabase.rpc('decrement_upvotes', { r_id: report_id })
      
      return NextResponse.json({ success: true, action: 'removed' });
    } else {
      // Insert new upvote
      const { error: insertError } = await supabase
        .from('report_upvotes')
        .insert([{ report_id, citizen_id }]);

      if (insertError) {
        console.error('Insert error:', insertError);
        return NextResponse.json({ error: 'Failed to record upvote' }, { status: 500 });
      }
      
      // Increment count
      // Note: Ideally use a PostgreSQL function / RPC for atomic increment
      
      return NextResponse.json({ success: true, action: 'added' });
    }

  } catch (error) {
    console.error('Upvote API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
