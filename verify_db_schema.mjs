import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('reports').insert({
    location_name: "Test Location",
    city: "Test City",
    state: "Test State",
    issue_type: "POTHOLE",
    severity: "VISIBLE",
    status: 'PENDING',
    is_public: true
  }).select().single();
  
  if (error) {
    console.error("Insert error:", error);
  } else {
    console.log("Insert success:", data);
  }
}
check();
