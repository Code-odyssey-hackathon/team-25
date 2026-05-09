-- ============================================================
-- JanaVaani — Add Super Admin
-- ============================================================
-- ⚠️ DEMO SEED DATA — Remove before production deployment
-- Replace email/password with real admin credentials in Supabase Dashboard

-- Ensure the user is in the authorities table to grant Admin Dashboard access

INSERT INTO authorities (
  auth_user_id,
  name,
  email,
  role,
  department
) VALUES (
  '4fdf5f20-5624-4d53-b8df-3cedbd40b13b',
  'Vaibhav Chavan Patil',
  'chavanpatilvaibhav395@gmail.com',
  'SUPER_ADMIN',
  'JanaVaani Administration'
)
ON CONFLICT (email) DO NOTHING;
