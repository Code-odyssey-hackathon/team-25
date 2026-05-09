import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
const anonClient = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log("Checking Engineer row with service role...");
  const { data: svcData, error: svcErr } = await serviceClient
    .from('engineers')
    .select('*')
    .eq('email', 'engineer@pwd.karnataka.gov.in');
  console.log("Service role result:", svcData, svcErr);

  console.log("Signing in with anon client...");
  const { data: authData, error: authErr } = await anonClient.auth.signInWithPassword({
    email: 'engineer@pwd.karnataka.gov.in',
    password: 'password123'
  });
  console.log("Sign in error?", authErr);
  if (authData?.user) {
    console.log("User ID:", authData.user.id);
    const { data: anonData, error: anonErr } = await anonClient
      .from('engineers')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .single();
    console.log("Anon client single result:", anonData, anonErr);
  }
}
check();
