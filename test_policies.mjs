import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
  const { data, error } = await serviceClient.rpc('exec_sql', { query: "SELECT * FROM pg_policies WHERE tablename = 'engineers';" });
  if (error) {
    console.error("RPC failed, trying raw query...", error.message);
    // Alternatively, I can just use the REST API to query a table, but pg_policies is a system table.
  } else {
    console.log(data);
  }
}
check();
