import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const anonClient = createClient(supabaseUrl, supabaseAnonKey);

async function checkTasks() {
  const { data: authData } = await anonClient.auth.signInWithPassword({
    email: 'engineer@pwd.karnataka.gov.in',
    password: 'password123'
  });
  
  if (authData?.user) {
    const { data: tasks, error } = await anonClient
      .from('engineer_tasks')
      .select('*');
    console.log("Tasks for engineer via Anon Client:", tasks, error);
  }
}
checkTasks();
