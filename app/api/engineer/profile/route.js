import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request) {
  return NextResponse.json({ message: 'Engineer profile endpoint active. Use POST to fetch profile.' });
}

export async function POST(request) {
  console.log('📬 Received engineer profile request');
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Try to find by auth_user_id
    let { data: engineer, error } = await supabase
      .from('engineers')
      .select('*')
      .eq('auth_user_id', userId)
      .maybeSingle();

    // 2. If not found, try to link by email
    if (!engineer) {
      // Get the user's email from auth
      const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(userId);
      
      if (user && user.email) {
        // Find engineer with matching email but NO auth_user_id
        const { data: existingEng } = await supabase
          .from('engineers')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();

        if (existingEng) {
          // Sync it!
          const { data: updatedEng } = await supabase
            .from('engineers')
            .update({ auth_user_id: userId })
            .eq('id', existingEng.id)
            .select()
            .single();
          
          engineer = updatedEng;
        }
      }
    }

    if (!engineer) {
      return NextResponse.json({ engineer: null }, { status: 200 });
    }

    return NextResponse.json({ engineer });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
