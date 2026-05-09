import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from('engineers')
      .select('id, name, email, specialization, department')
      .eq('is_active', true)
      .order('name');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ engineers: data || [] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
export async function POST(request) {
  try {
    const engineerData = await request.json();
    const DEFAULT_PASSWORD = 'password123';
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Check if auth user exists, if not create one
    let authUserId;
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    const existingAuthUser = users?.users?.find(u => u.email === engineerData.email);

    if (existingAuthUser) {
      authUserId = existingAuthUser.id;
    } else {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: engineerData.email,
        password: engineerData.password || DEFAULT_PASSWORD,
        email_confirm: true
      });
      if (createError) {
        console.error('Auth Creation Error:', createError);
        return NextResponse.json({ error: `Auth Error: ${createError.message}` }, { status: 400 });
      }
      authUserId = newUser.user.id;
    }

    // 2. Insert/Update engineer record
    const { data, error } = await supabase
      .from('engineers')
      .upsert({
        name: engineerData.name,
        email: engineerData.email,
        auth_user_id: authUserId,
        specialization: engineerData.specialization,
        department: engineerData.department,
        contact_phone: engineerData.contact_phone,
        is_active: true
      }, { onConflict: 'email' })
      .select()
      .single();

    if (error) {
      console.error('Database Engineer Error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ engineer: data, temporaryPassword: engineerData.password || DEFAULT_PASSWORD });
  } catch (error) {
    console.error('System API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
