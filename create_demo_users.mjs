import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase URL or Service Role Key in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createDemoUsers() {
  console.log("Setting up demo users for JanaVaani...");

  // 1. Setup Admin
  const adminEmail = 'admin@pwd.karnataka.gov.in';
  const adminPassword = 'password123';
  
  let adminId;
  const { data: existingAdminUsers, error: adminListErr } = await supabase.auth.admin.listUsers();
  const existingAdmin = existingAdminUsers?.users.find(u => u.email === adminEmail);
  
  if (existingAdmin) {
    adminId = existingAdmin.id;
    console.log("✅ Admin auth user already exists.");
  } else {
    const { data: adminAuthData, error: adminAuthErr } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true
    });
    if (adminAuthErr) throw adminAuthErr;
    adminId = adminAuthData.user.id;
    console.log("✅ Created Admin auth user.");
  }

  // Check if authority record exists
  const { data: authRecord } = await supabase.from('authorities').select('*').eq('email', adminEmail).single();
  if (!authRecord) {
    await supabase.from('authorities').insert({
      auth_user_id: adminId,
      name: 'Demo Admin Officer',
      email: adminEmail,
      role: 'SUPER_ADMIN',
      department: 'PWD Karnataka',
      jurisdiction: { state: 'Karnataka' },
      is_active: true
    });
    console.log("✅ Created Authority record for Admin.");
  } else {
    console.log("✅ Authority record already exists.");
  }

  // 2. Setup Engineer
  const engineerEmail = 'engineer@pwd.karnataka.gov.in';
  const engineerPassword = 'password123';
  
  let engineerId;
  const existingEngineer = existingAdminUsers?.users.find(u => u.email === engineerEmail);
  
  if (existingEngineer) {
    engineerId = existingEngineer.id;
    console.log("✅ Engineer auth user already exists.");
  } else {
    const { data: engAuthData, error: engAuthErr } = await supabase.auth.admin.createUser({
      email: engineerEmail,
      password: engineerPassword,
      email_confirm: true
    });
    if (engAuthErr) throw engAuthErr;
    engineerId = engAuthData.user.id;
    console.log("✅ Created Engineer auth user.");
  }

  // Check if engineer record exists
  const { data: engRecord } = await supabase.from('engineers').select('*').eq('email', engineerEmail).single();
  if (!engRecord) {
    await supabase.from('engineers').insert({
      auth_user_id: engineerId,
      name: 'Demo Field Engineer',
      email: engineerEmail,
      specialization: 'Structural Engineering',
      department: 'PWD Maintenance',
      is_active: true
    });
    console.log("✅ Created Engineer record.");
  } else {
    console.log("✅ Engineer record already exists.");
  }

  console.log("\n🎉 DEMO CREDENTIALS READY");
  console.log("-----------------------------------------");
  console.log("Admin Login:");
  console.log(`Email: ${adminEmail}`);
  console.log(`Password: ${adminPassword}`);
  console.log("-----------------------------------------");
  console.log("Engineer Login:");
  console.log(`Email: ${engineerEmail}`);
  console.log(`Password: ${engineerPassword}`);
  console.log("-----------------------------------------");
}

createDemoUsers().catch(console.error);
