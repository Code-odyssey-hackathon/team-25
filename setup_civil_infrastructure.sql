-- ============================================================
-- JanaVaani — Civil Infrastructure Issues Database Setup
-- For all civil problems (not just bridges)
-- ============================================================

-- Clean up legacy tables before creating the new schema
DROP TABLE IF EXISTS engineer_tasks CASCADE;
DROP TABLE IF EXISTS engineers CASCADE;
DROP TABLE IF EXISTS report_upvotes CASCADE;
DROP TABLE IF EXISTS report_verifications CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS inspections CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS truth_counter CASCADE;
DROP TABLE IF EXISTS authorities CASCADE;
DROP TABLE IF EXISTS bridges CASCADE;
DROP TABLE IF EXISTS master_tickets CASCADE;
DROP TABLE IF EXISTS ledger_audit_logs CASCADE;

-- ────────────────────────────────────────────────────────────
-- 1. Custom ENUM types
-- ────────────────────────────────────────────────────────────

DROP TYPE IF EXISTS issue_type CASCADE;
CREATE TYPE issue_type AS ENUM ('POTHOLE', 'ROAD_CRACK', 'WATER_LEAK', 'STREETLIGHT_OUT', 'GARBAGE_DUMP', 'STRUCTURAL_DAMAGE', 'DRAINAGE_ISSUE', 'OTHER');

DROP TYPE IF EXISTS severity CASCADE;
CREATE TYPE severity AS ENUM ('VISIBLE', 'SERIOUS', 'DANGEROUS');

DROP TYPE IF EXISTS report_status CASCADE;
CREATE TYPE report_status AS ENUM ('PENDING', 'UNDER_REVIEW', 'ACTION_TAKEN', 'DISMISSED', 'IGNORED');

DROP TYPE IF EXISTS authority_role CASCADE;
CREATE TYPE authority_role AS ENUM ('MUNICIPAL_ENGINEER', 'WARD_OFFICER', 'STATE_AUTHORITY', 'SUPER_ADMIN');

DROP TYPE IF EXISTS alert_type CASCADE;
CREATE TYPE alert_type AS ENUM ('HIGH_PRIORITY', 'MONSOON_RISK', 'ESCALATION_OVERDUE', 'CRITICAL_ISSUE', 'AUTO_ESCALATED');

-- ────────────────────────────────────────────────────────────
-- 2. authorities  (admin / government users)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS authorities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id    UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  role            authority_role NOT NULL DEFAULT 'MUNICIPAL_ENGINEER',
  jurisdiction    JSONB NOT NULL DEFAULT '{}',
  department      TEXT,
  contact_phone   TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_login      TIMESTAMPTZ,
  total_actioned  INT NOT NULL DEFAULT 0,
  total_ignored   INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 3. reports  (citizen submissions for civil infrastructure issues)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_name     TEXT,
  reporter_hash     TEXT,
  photo_url         TEXT,
  photo_path        TEXT,
  issue_type        issue_type NOT NULL,
  severity          severity NOT NULL,
  description       TEXT,
  lat               DOUBLE PRECISION,
  lng               DOUBLE PRECISION,
  address           TEXT,
  city              TEXT,
  state             TEXT,
  pincode           TEXT,
  status            report_status NOT NULL DEFAULT 'PENDING',
  responded_by      UUID REFERENCES authorities(id) ON DELETE SET NULL,
  response_status   TEXT,
  response_notes    TEXT,
  proof_photo_url   TEXT,
  responded_at      TIMESTAMPTZ,
  days_unaddressed  INT NOT NULL DEFAULT 0,
  auto_escalated_at TIMESTAMPTZ,
  is_public         BOOLEAN NOT NULL DEFAULT TRUE,
  citizen_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  audio_url         TEXT,
  ai_transcript     TEXT,
  upvotes_count    INTEGER DEFAULT 0,
  ai_confidence     REAL,
  verification_count INT NOT NULL DEFAULT 0,
  last_verified_at  TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 4. inspections
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS inspections (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id             UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  conducted_by          UUID REFERENCES authorities(id) ON DELETE SET NULL,
  inspector_name        TEXT,
  inspection_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  findings              JSONB NOT NULL DEFAULT '{}',
  report_pdf_url        TEXT,
  report_pdf_path       TEXT,
  next_inspection_due   DATE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 5. alerts
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id       UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  authority_id    UUID REFERENCES authorities(id) ON DELETE SET NULL,
  alert_type      alert_type NOT NULL,
  message         TEXT NOT NULL,
  data            JSONB NOT NULL DEFAULT '{}',
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 6. truth_counter  (single-row reference table)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS truth_counter (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  official_issues           INT NOT NULL DEFAULT 0,
  official_source           TEXT,
  official_source_url       TEXT,
  reality_issues            INT NOT NULL DEFAULT 0,
  reality_deaths            INT NOT NULL DEFAULT 0,
  reality_injured           INT NOT NULL DEFAULT 0,
  reality_source            TEXT,
  citizen_reports_on_platform INT NOT NULL DEFAULT 0,
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 7. Additional tables for features
-- ────────────────────────────────────────────────────────────

-- Report verifications
CREATE TABLE IF NOT EXISTS report_verifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id         UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  citizen_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verified_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes             TEXT,
  UNIQUE(report_id, citizen_id)
);

-- Report upvotes
CREATE TABLE IF NOT EXISTS report_upvotes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id uuid REFERENCES reports(id) ON DELETE CASCADE,
    citizen_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(report_id, citizen_id)
);

-- Field engineers table
CREATE TABLE IF NOT EXISTS engineers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id    UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  employee_id     TEXT,
  specialization  TEXT,
  department      TEXT,
  contact_phone   TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_login      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Engineer tasks
DROP TYPE IF EXISTS engineer_task_status CASCADE;
CREATE TYPE engineer_task_status AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CLOSED');

DROP TYPE IF EXISTS engineer_task_priority CASCADE;
CREATE TYPE engineer_task_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

CREATE TABLE IF NOT EXISTS engineer_tasks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id         UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  assigned_by       UUID NOT NULL REFERENCES authorities(id) ON DELETE CASCADE,
  assigned_to       UUID NOT NULL REFERENCES engineers(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT,
  priority          engineer_task_priority NOT NULL DEFAULT 'MEDIUM',
  status            engineer_task_status NOT NULL DEFAULT 'OPEN',
  due_date          DATE,
  completion_notes  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at      TIMESTAMPTZ
);

-- Audit logs
CREATE TABLE IF NOT EXISTS ledger_audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_id uuid NOT NULL,
    entity_type text NOT NULL,
    action text NOT NULL,
    previous_state jsonb,
    new_state jsonb,
    tx_hash text UNIQUE NOT NULL,
    timestamp timestamp with time zone DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 8. Storage Buckets
-- ────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'report-photos',
  'report-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'proof-photos',
  'proof-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'inspection-pdfs',
  'inspection-pdfs',
  true,
  10485760,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 9. Indexes
-- ────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_city ON reports(city);
CREATE INDEX IF NOT EXISTS idx_reports_state ON reports(state);
CREATE INDEX IF NOT EXISTS idx_reports_issue_type ON reports(issue_type);
CREATE INDEX IF NOT EXISTS idx_authorities_email ON authorities(email);
CREATE INDEX IF NOT EXISTS idx_reports_citizen_id ON reports (citizen_id);
CREATE INDEX IF NOT EXISTS idx_verifications_report_id ON report_verifications (report_id);
CREATE INDEX IF NOT EXISTS idx_verifications_citizen_id ON report_verifications (citizen_id);
CREATE INDEX IF NOT EXISTS idx_reports_verification_count ON reports (verification_count DESC);
CREATE INDEX IF NOT EXISTS idx_engineers_auth_user ON engineers(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_engineers_active ON engineers(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON engineer_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON engineer_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_report ON engineer_tasks(report_id);

-- ────────────────────────────────────────────────────────────
-- 10. Functions
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION bulk_update_days_unaddressed()
RETURNS void LANGUAGE sql AS $$
  UPDATE reports
  SET days_unaddressed = EXTRACT(DAY FROM now() - created_at)::int
  WHERE status IN ('PENDING', 'UNDER_REVIEW');
$$;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_report_verification_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE reports 
    SET verification_count = verification_count + 1,
        last_verified_at = NEW.verified_at
    WHERE id = NEW.report_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE reports 
    SET verification_count = verification_count - 1
    WHERE id = OLD.report_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ────────────────────────────────────────────────────────────
-- 11. Triggers
-- ────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_reports_updated ON reports;
CREATE TRIGGER trg_reports_updated
  BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_authorities_updated ON authorities;
CREATE TRIGGER trg_authorities_updated
  BEFORE UPDATE ON authorities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_engineers_updated ON engineers;
CREATE TRIGGER trg_engineers_updated
  BEFORE UPDATE ON engineers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_engineer_tasks_updated ON engineer_tasks;
CREATE TRIGGER trg_engineer_tasks_updated
  BEFORE UPDATE ON engineer_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_verification_count ON report_verifications;
CREATE TRIGGER trg_update_verification_count
  AFTER INSERT OR DELETE ON report_verifications
  FOR EACH ROW EXECUTE FUNCTION update_report_verification_count();

-- ────────────────────────────────────────────────────────────
-- 12. RLS Policies
-- ────────────────────────────────────────────────────────────

ALTER TABLE IF EXISTS authorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS report_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS report_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS engineers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS engineer_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ledger_audit_logs ENABLE ROW LEVEL SECURITY;

-- Basic public read policies
DROP POLICY IF EXISTS "reports_public_read" ON reports;
CREATE POLICY "reports_public_read" ON reports FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "reports_authenticated_insert" ON reports;
CREATE POLICY "reports_authenticated_insert" ON reports FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "inspections_public_read" ON inspections;
CREATE POLICY "inspections_public_read" ON inspections FOR SELECT USING (true);

DROP POLICY IF EXISTS "authorities_public_limited_read" ON authorities;
CREATE POLICY "authorities_public_limited_read" ON authorities FOR SELECT USING (true);

DROP POLICY IF EXISTS "verifications_public_read" ON report_verifications;
CREATE POLICY "verifications_public_read" ON report_verifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view upvotes" ON report_upvotes;
CREATE POLICY "Anyone can view upvotes" ON report_upvotes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can upvote" ON report_upvotes;
CREATE POLICY "Authenticated users can upvote" ON report_upvotes FOR INSERT TO authenticated WITH CHECK (auth.uid() = citizen_id);

DROP POLICY IF EXISTS "Users can remove their own upvote" ON report_upvotes;
CREATE POLICY "Users can remove their own upvote" ON report_upvotes FOR DELETE TO authenticated USING (auth.uid() = citizen_id);

DROP POLICY IF EXISTS "Public can view audit logs" ON ledger_audit_logs;
CREATE POLICY "Public can view audit logs" ON ledger_audit_logs FOR SELECT USING (true);

-- Storage policies
DROP POLICY IF EXISTS "report_photos_public_read" ON storage.objects;
CREATE POLICY "report_photos_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'report-photos');

DROP POLICY IF EXISTS "report_photos_anon_upload" ON storage.objects;
CREATE POLICY "report_photos_anon_upload" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'report-photos');

DROP POLICY IF EXISTS "proof_photos_public_read" ON storage.objects;
CREATE POLICY "proof_photos_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'proof-photos');

DROP POLICY IF EXISTS "proof_photos_admin_upload" ON storage.objects;
CREATE POLICY "proof_photos_admin_upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'proof-photos' AND EXISTS (SELECT 1 FROM public.authorities WHERE auth_user_id = auth.uid() AND is_active = true));

DROP POLICY IF EXISTS "inspection_pdfs_public_read" ON storage.objects;
CREATE POLICY "inspection_pdfs_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'inspection-pdfs');

DROP POLICY IF EXISTS "inspection_pdfs_admin_upload" ON storage.objects;
CREATE POLICY "inspection_pdfs_admin_upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'inspection-pdfs' AND EXISTS (SELECT 1 FROM public.authorities WHERE auth_user_id = auth.uid() AND is_active = true));

-- ────────────────────────────────────────────────────────────
-- 13. Seed Data
-- ────────────────────────────────────────────────────────────

INSERT INTO truth_counter (
  official_issues, official_source, official_source_url,
  reality_issues, reality_deaths, reality_injured, reality_source,
  citizen_reports_on_platform
) VALUES (
  5000,
  'Municipal Corporation Records 2024',
  'https://data.gov.in/resource/civil-infrastructure',
  15000,
  200,
  450,
  'Media Analysis July 2025',
  0
) ON CONFLICT DO NOTHING;

-- Demo Reports
INSERT INTO reports (
  location_name, issue_type, severity, description, lat, lng, 
  address, city, state, pincode, status, days_unaddressed, created_at
) VALUES
(
  'Main Road Junction',
  'POTHOLE',
  'DANGEROUS',
  'Large pothole approximately 2 feet wide causing accidents. Located near the main traffic signal.',
  15.3647, 75.1240,
  'Main Road, near City Center',
  'Hubli',
  'Karnataka',
  '580020',
  'PENDING',
  15,
  now() - interval '15 days'
),
(
  'Residential Area Drain',
  'WATER_LEAK',
  'SERIOUS',
  'Underground water pipe leaking continuously for past 3 days. Water wastage and road damage.',
  15.4589, 75.0078,
  '5th Cross, 3rd Block',
  'Dharwad',
  'Karnataka',
  '580001',
  'UNDER_REVIEW',
  7,
  now() - interval '7 days'
),
(
  'Market Street',
  'GARBAGE_DUMP',
  'SERIOUS',
  'Illegal garbage dumping by roadside. Foul smell and health hazard for nearby residents.',
  15.8497, 74.4977,
  'Market Street, near Bus Stand',
  'Belagavi',
  'Karnataka',
  '590001',
  'PENDING',
  3,
  now() - interval '3 days'
),
(
  'Highway NH-4',
  'ROAD_CRACK',
  'VISIBLE',
  'Multiple cracks appearing on the highway surface. Needs immediate repair before monsoon.',
  15.7749, 74.9643,
  'NH-4, near KLE Hospital',
  'Belagavi',
  'Karnataka',
  '590010',
  'ACTION_TAKEN',
  0,
  now() - interval '30 days'
),
(
  'Industrial Area',
  'STREETLIGHT_OUT',
  'SERIOUS',
  'Multiple streetlights not working since 2 weeks. Safety concern for night-time commuters.',
  15.3647, 76.4600,
  'Gokul Road, Industrial Area',
  'Hubli',
  'Karnataka',
  '580030',
  'PENDING',
  14,
  now() - interval '14 days'
) ON CONFLICT DO NOTHING;

-- Admin User (Demo)
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
  'Civil Infrastructure Administration'
)
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- END OF DATABASE SETUP
-- ============================================================