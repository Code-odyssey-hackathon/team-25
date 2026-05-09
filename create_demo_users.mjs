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
  const { data: existingAdminUsers, error: adminListErr } = await supabase.auth.admin.listUsers();
  if (adminListErr) throw adminListErr;

  // Check if authority records exist
  const adminProfiles = [
    { email: 'municipal@karnataka.gov.in', name: 'Demo Municipal Officer', role: 'HDMC_OFFICER', level: 'MUNICIPAL' },
    { email: 'dc@karnataka.gov.in', name: 'Demo District Collector', role: 'STATE_AUTHORITY', level: 'DISTRICT_COLLECTOR' },
    { email: 'minister@karnataka.gov.in', name: 'Demo Minister of Welfare', role: 'SUPER_ADMIN', level: 'MINISTER_OF_WELFARE' }
  ];

  for (const profile of adminProfiles) {
    let uId;
    const existing = existingAdminUsers?.users.find(u => u.email === profile.email);
    if (existing) {
      uId = existing.id;
    } else {
      const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email: profile.email,
        password: 'password123',
        email_confirm: true
      });
      if (authErr) throw authErr;
      uId = authData.user.id;
      console.log(`✅ Created auth user for ${profile.email}`);
    }

    const { data: authRecord } = await supabase.from('authorities').select('*').eq('email', profile.email).single();
    if (!authRecord) {
      await supabase.from('authorities').insert({
        auth_user_id: uId,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        department: 'Govt of Karnataka',
        jurisdiction: { state: 'Karnataka', level: profile.level },
        is_active: true
      });
      console.log(`✅ Created Authority record for ${profile.level}.`);
    } else {
      // Update jurisdiction if missing level
      await supabase.from('authorities').update({
        jurisdiction: { ...authRecord.jurisdiction, level: profile.level }
      }).eq('id', authRecord.id);
      console.log(`✅ Authority record exists for ${profile.level}. Updated jurisdiction.`);
    }
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
  console.log("Admin (Municipal): municipal@karnataka.gov.in / password123");
  console.log("Admin (DC):       dc@karnataka.gov.in / password123");
  console.log("Admin (Minister): minister@karnataka.gov.in / password123");
  console.log("-----------------------------------------");
  console.log("Engineer Login:");
  console.log(`Email: ${engineerEmail}`);
  console.log(`Password: ${engineerPassword}`);
  console.log("-----------------------------------------");
}

createDemoUsers().catch(console.error);
