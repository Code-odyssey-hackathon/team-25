import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function syncAdmin() {
  console.log("🔍 Looking up auth user: chavanpatilvaibhav395@gmail.com");

  // Find the auth user
  const { data: usersData } = await supabase.auth.admin.listUsers();
  const adminUser = usersData?.users.find(u => u.email === 'chavanpatilvaibhav395@gmail.com');

  if (!adminUser) {
    console.log("❌ No auth user found with that email. Creating...");
    const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
      email: 'chavanpatilvaibhav395@gmail.com',
      password: 'VAIBHAV2667',
      email_confirm: true,
    });
    if (createErr) { console.error("Create failed:", createErr); return; }
    console.log("✅ Auth user created:", newUser.user.id);
    await upsertAuthority(newUser.user.id);
  } else {
    console.log("✅ Auth user exists:", adminUser.id);
    await upsertAuthority(adminUser.id);
  }

  // Also check the engineer record exists
  console.log("\n🔍 Checking engineer record...");
  const { data: engRecords } = await supabase.from('engineers').select('*');
  console.log("Engineers in DB:", engRecords);

  // Check authorities
  console.log("\n🔍 Checking authorities records...");
  const { data: authRecords } = await supabase.from('authorities').select('*');
  console.log("Authorities in DB:", authRecords);
}

async function upsertAuthority(authUserId) {
  // Check if authority record exists
  const { data: existing } = await supabase
    .from('authorities')
    .select('*')
    .eq('auth_user_id', authUserId)
    .single();

  if (existing) {
    console.log("✅ Authority record already exists:", existing.id, existing.name, existing.role);
    return;
  }

  // Also check by email
  const { data: byEmail } = await supabase
    .from('authorities')
    .select('*')
    .eq('email', 'chavanpatilvaibhav395@gmail.com')
    .single();

  if (byEmail) {
    // Link the auth user to the existing authority record
    const { error } = await supabase
      .from('authorities')
      .update({ auth_user_id: authUserId })
      .eq('id', byEmail.id);
    if (error) console.error("Link failed:", error);
    else console.log("✅ Linked auth user to existing authority:", byEmail.id);
    return;
  }

  // Create new authority record
  const { data, error } = await supabase.from('authorities').insert({
    auth_user_id: authUserId,
    name: 'Vaibhav Chavan Patil',
    email: 'chavanpatilvaibhav395@gmail.com',
    role: 'SUPER_ADMIN',
    department: 'PWD Karnataka',
    jurisdiction: { state: 'Karnataka' },
    is_active: true,
  }).select().single();

  if (error) {
    console.error("❌ Authority insert failed:", error);
  } else {
    console.log("✅ Authority record created:", data.id);
  }
}

syncAdmin();
