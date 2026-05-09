import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = envFile.split('\n').reduce((acc, line) => {
  const [key, ...value] = line.split('=');
  if (key && value) acc[key.trim()] = value.join('=').trim().replace(/^"|"$/g, '');
  return acc;
}, {});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPolicies() {
  const { data, error } = await supabase.rpc('execute_sql', { 
    sql: "SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';" 
  });
  
  if (error) {
    const { data: d2, error: e2 } = await supabase.from('pg_policies').select('*').limit(50);
    console.log('Policies from fallback query:', d2);
    if (e2) console.error('Fallback error:', e2.message);
  } else {
    console.log('Policies:', data);
  }
}

// Alternatively, let's just create the policy!
checkPolicies();
