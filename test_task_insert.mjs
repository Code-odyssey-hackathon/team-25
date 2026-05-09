import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testInsert() {
  console.log("Fetching a valid bridge and report...");
  const { data: report } = await supabase.from('reports').select('id, bridge_id, bridge_name').limit(1).single();
  const { data: engineer } = await supabase.from('engineers').select('id').limit(1).single();
  const { data: authority } = await supabase.from('authorities').select('id').limit(1).single();

  if (!report || !engineer || !authority) {
    console.error("Missing test data", { report, engineer, authority });
    return;
  }

  console.log("Testing insert with:", {
    bridge_id: report.bridge_id,
    assigned_by: authority.id,
    assigned_to: engineer.id,
    report_id: report.id
  });

  const { data, error } = await supabase.from('engineer_tasks').insert({
    bridge_id: report.bridge_id,
    bridge_name: report.bridge_name || 'Test Bridge',
    report_id: report.id,
    assigned_by: authority.id,
    assigned_to: engineer.id,
    title: 'Test Task Creation',
    description: 'Testing if API insert works',
    priority: 'MEDIUM',
    status: 'OPEN'
  }).select().single();

  if (error) {
    console.error("Insert failed!", error);
  } else {
    console.log("Insert success!", data.id);
  }
}
testInsert();
