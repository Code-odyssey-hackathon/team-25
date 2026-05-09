-- ============================================================
-- JanaVaani — Complete Database Setup Script
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Custom ENUM types (with existence checks)
-- ────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bridge_status') THEN
    CREATE TYPE bridge_status AS ENUM ('SAFE', 'MONITOR', 'WARNING', 'CRITICAL');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'damage_type') THEN
    CREATE TYPE damage_type AS ENUM ('CRACK', 'SCOUR', 'RAILING_BROKEN', 'OVERLOADING', 'FOUNDATION', 'SPALLING', 'OTHER');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'severity') THEN
    CREATE TYPE severity AS ENUM ('VISIBLE', 'SERIOUS', 'DANGEROUS');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN
    CREATE TYPE report_status AS ENUM ('PENDING', 'UNDER_REVIEW', 'ACTION_TAKEN', 'DISMISSED', 'IGNORED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'authority_role') THEN
    CREATE TYPE authority_role AS ENUM ('PWD_ENGINEER', 'HDMC_OFFICER', 'STATE_AUTHORITY', 'SUPER_ADMIN');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alert_type') THEN
    CREATE TYPE alert_type AS ENUM ('RISK_SCORE_HIGH', 'MONSOON_SPIKE', 'INSPECTION_OVERDUE', 'REPORT_CRITICAL', 'AUTO_ESCALATED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inspection_type') THEN
    CREATE TYPE inspection_type AS ENUM ('PRE_MONSOON', 'POST_MONSOON', 'SPECIAL', 'ROUTINE');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'overall_condition') THEN
    CREATE TYPE overall_condition AS ENUM ('GOOD', 'FAIR', 'POOR', 'CRITICAL');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'seismic_zone') THEN
    CREATE TYPE seismic_zone AS ENUM ('II', 'III', 'IV', 'V', 'VI');
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 2. authorities  (admin / government users)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS authorities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id    UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  role            authority_role NOT NULL DEFAULT 'PWD_ENGINEER',
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
-- 3. bridges
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bridges (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    TEXT NOT NULL,
  lat                     DOUBLE PRECISION NOT NULL,
  lng                     DOUBLE PRECISION NOT NULL,
  district                TEXT,
  state                   TEXT,
  address                 TEXT,
  year_built              INT,
  bridge_type             TEXT,
  length_m                NUMERIC(10,2),
  width_m                 NUMERIC(10,2),
  design_load             TEXT,
  material                TEXT,
  seismic_zone            seismic_zone,
  responsible_authority   TEXT,
  authority_id            UUID REFERENCES authorities(id) ON DELETE SET NULL,
  last_inspection_date    DATE,
  last_inspection_report  TEXT,
  risk_score              INT NOT NULL DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
  risk_breakdown          JSONB NOT NULL DEFAULT '{}',
  status                  bridge_status NOT NULL DEFAULT 'SAFE',
  total_reports           INT NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 4. reports  (citizen submissions)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bridge_id         UUID NOT NULL REFERENCES bridges(id) ON DELETE CASCADE,
  bridge_name       TEXT,
  reporter_hash     TEXT,
  photo_url         TEXT,
  photo_path        TEXT,
  damage_type       damage_type NOT NULL,
  severity          severity NOT NULL,
  description       TEXT,
  lat               DOUBLE PRECISION,
  lng               DOUBLE PRECISION,
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
  detected_age_group TEXT,
  age_detection_confidence REAL,
  master_ticket_id  UUID,
  verification_count INT NOT NULL DEFAULT 0,
  last_verified_at  TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 5. inspections
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS inspections (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bridge_id             UUID NOT NULL REFERENCES bridges(id) ON DELETE CASCADE,
  conducted_by          UUID REFERENCES authorities(id) ON DELETE SET NULL,
  inspector_name        TEXT,
  inspection_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  inspection_type       inspection_type NOT NULL DEFAULT 'ROUTINE',
  findings              JSONB NOT NULL DEFAULT '{}',
  irc_compliance_score  INT CHECK (irc_compliance_score BETWEEN 0 AND 100),
  report_pdf_url        TEXT,
  report_pdf_path       TEXT,
  next_inspection_due   DATE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 6. alerts
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bridge_id       UUID NOT NULL REFERENCES bridges(id) ON DELETE CASCADE,
  bridge_name     TEXT,
  authority_id    UUID REFERENCES authorities(id) ON DELETE SET NULL,
  alert_type      alert_type NOT NULL,
  message         TEXT NOT NULL,
  data            JSONB NOT NULL DEFAULT '{}',
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 7. truth_counter  (single-row reference table)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS truth_counter (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  official_collapses        INT NOT NULL DEFAULT 0,
  official_source           TEXT,
  official_source_url       TEXT,
  reality_collapses         INT NOT NULL DEFAULT 0,
  reality_deaths            INT NOT NULL DEFAULT 0,
  reality_injured           INT NOT NULL DEFAULT 0,
  reality_source            TEXT,
  citizen_reports_on_platform INT NOT NULL DEFAULT 0,
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 8. Additional tables for features
-- ────────────────────────────────────────────────────────────

-- Report verifications
CREATE TABLE report_verifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id         UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  citizen_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bridge_id         UUID NOT NULL REFERENCES bridges(id) ON DELETE CASCADE,
  verified_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes             TEXT,
  UNIQUE(report_id, citizen_id)
);

-- Report upvotes
CREATE TABLE report_upvotes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id uuid REFERENCES reports(id) ON DELETE CASCADE,
    citizen_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(report_id, citizen_id)
);

-- Engineers table
CREATE TABLE engineers (
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
CREATE TYPE engineer_task_status AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CLOSED');
CREATE TYPE engineer_task_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

CREATE TABLE engineer_tasks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bridge_id         UUID NOT NULL REFERENCES bridges(id) ON DELETE CASCADE,
  bridge_name       TEXT,
  report_id         UUID REFERENCES reports(id) ON DELETE SET NULL,
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

-- Master tickets
CREATE TABLE master_tickets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    bridge_id uuid REFERENCES bridges(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    severity text,
    damage_type text,
    status text DEFAULT 'PENDING_REVIEW',
    confidence_score float,
    assigned_department text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Audit logs
CREATE TABLE ledger_audit_logs (
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
-- 9. Storage Buckets
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
-- 10. Indexes
-- ────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_reports_bridge_id ON reports(bridge_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bridges_district ON bridges(district);
CREATE INDEX IF NOT EXISTS idx_bridges_status ON bridges(status);
CREATE INDEX IF NOT EXISTS idx_authorities_email ON authorities(email);
CREATE INDEX IF NOT EXISTS idx_reports_citizen_id ON reports (citizen_id);
CREATE INDEX IF NOT EXISTS idx_verifications_report_id ON report_verifications (report_id);
CREATE INDEX IF NOT EXISTS idx_verifications_citizen_id ON report_verifications (citizen_id);
CREATE INDEX IF NOT EXISTS idx_verifications_bridge_id ON report_verifications (bridge_id);
CREATE INDEX IF NOT EXISTS idx_reports_verification_count ON reports (verification_count DESC);
CREATE INDEX IF NOT EXISTS idx_reports_age_group ON reports (detected_age_group) WHERE detected_age_group IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_engineers_auth_user ON engineers(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_engineers_active ON engineers(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON engineer_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON engineer_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_bridge ON engineer_tasks(bridge_id);

-- ────────────────────────────────────────────────────────────
-- 11. Functions and Triggers
-- ────────────────────────────────────────────────────────────

-- Helper function to update days_unaddressed
CREATE OR REPLACE FUNCTION bulk_update_days_unaddressed()
RETURNS void LANGUAGE sql AS $$
  UPDATE reports
  SET days_unaddressed = EXTRACT(DAY FROM now() - created_at)::int
  WHERE status IN ('PENDING', 'UNDER_REVIEW');
$$;

-- Function to increment bridge reports
CREATE OR REPLACE FUNCTION increment_bridge_reports(bridge_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE bridges
  SET total_reports = total_reports + 1
  WHERE id = bridge_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update verification count
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

-- Triggers for updated_at
DROP TRIGGER IF EXISTS trg_bridges_updated ON bridges;
CREATE TRIGGER trg_bridges_updated
  BEFORE UPDATE ON bridges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- Trigger for verification count
DROP TRIGGER IF EXISTS trg_update_verification_count ON report_verifications;
CREATE TRIGGER trg_update_verification_count
  AFTER INSERT OR DELETE ON report_verifications
  FOR EACH ROW EXECUTE FUNCTION update_report_verification_count();

-- ────────────────────────────────────────────────────────────
-- 12. RLS Policies
-- ────────────────────────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE IF EXISTS authorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bridges ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS report_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS report_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS engineers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS engineer_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS master_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ledger_audit_logs ENABLE ROW LEVEL SECURITY;

-- Authorities policies
DROP POLICY IF EXISTS "authorities_public_limited_read" ON authorities;
CREATE POLICY "authorities_public_limited_read"
  ON authorities FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "authorities_admin_read" ON authorities;
CREATE POLICY "authorities_admin_read"
  ON authorities FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM authorities
      WHERE auth_user_id = auth.uid() AND is_active = true
    )
  );

-- Bridges policies (public read)
DROP POLICY IF EXISTS "bridges_public_read" ON bridges;
CREATE POLICY "bridges_public_read"
  ON bridges FOR SELECT
  USING (true);

-- Reports policies
DROP POLICY IF EXISTS "reports_public_read" ON reports;
CREATE POLICY "reports_public_read"
  ON reports FOR SELECT
  USING (is_public = true);

DROP POLICY IF EXISTS "reports_admin_read_all" ON reports;
CREATE POLICY "reports_admin_read_all"
  ON reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM authorities
      WHERE authorities.auth_user_id = auth.uid()
        AND authorities.is_active = true
    )
  );

DROP POLICY IF EXISTS "reports_authenticated_insert" ON reports;
CREATE POLICY "reports_authenticated_insert"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Inspections policies
DROP POLICY IF EXISTS "inspections_public_read" ON inspections;
CREATE POLICY "inspections_public_read"
  ON inspections FOR SELECT
  USING (true);

-- Alerts policies
DROP POLICY IF EXISTS "alerts_admin_read" ON alerts;
CREATE POLICY "alerts_admin_read"
  ON alerts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM authorities
      WHERE auth_user_id = auth.uid() AND is_active = true
    )
  );

-- Report verifications policies
DROP POLICY IF EXISTS "verifications_public_read" ON report_verifications;
CREATE POLICY "verifications_public_read"
  ON report_verifications FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "verifications_citizen_insert" ON report_verifications;
CREATE POLICY "verifications_citizen_insert"
  ON report_verifications FOR INSERT
  TO authenticated
  WITH CHECK (
    citizen_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM reports r
      WHERE r.id = report_id
      AND r.citizen_id != auth.uid()
    )
  );

DROP POLICY IF EXISTS "verifications_citizen_delete" ON report_verifications;
CREATE POLICY "verifications_citizen_delete"
  ON report_verifications FOR DELETE
  TO authenticated
  USING (citizen_id = auth.uid());

-- Report upvotes policies
DROP POLICY IF EXISTS "Anyone can view upvotes" ON report_upvotes;
CREATE POLICY "Anyone can view upvotes" ON report_upvotes
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can upvote" ON report_upvotes;
CREATE POLICY "Authenticated users can upvote" ON report_upvotes
    FOR INSERT WITH CHECK (auth.uid() = citizen_id);

DROP POLICY IF EXISTS "Users can remove their own upvote" ON report_upvotes;
CREATE POLICY "Users can remove their own upvote" ON report_upvotes
    FOR DELETE USING (auth.uid() = citizen_id);

-- Engineers policies
DROP POLICY IF EXISTS "Engineers can view own profile" ON engineers;
CREATE POLICY "Engineers can view own profile"
  ON engineers FOR SELECT
  USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all engineers" ON engineers;
CREATE POLICY "Admins can view all engineers"
  ON engineers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM authorities
      WHERE authorities.auth_user_id = auth.uid()
        AND authorities.is_active = TRUE
    )
  );

DROP POLICY IF EXISTS "Only super admins can insert engineers" ON engineers;
CREATE POLICY "Only super admins can insert engineers"
  ON engineers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM authorities
      WHERE authorities.auth_user_id = auth.uid()
        AND authorities.role = 'SUPER_ADMIN'
        AND authorities.is_active = TRUE
    )
  );

DROP POLICY IF EXISTS "Only super admins can update engineers" ON engineers;
CREATE POLICY "Only super admins can update engineers"
  ON engineers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM authorities
      WHERE authorities.auth_user_id = auth.uid()
        AND authorities.role = 'SUPER_ADMIN'
        AND authorities.is_active = TRUE
    )
  );

-- Engineer tasks policies
DROP POLICY IF EXISTS "Engineers can view own tasks" ON engineer_tasks;
CREATE POLICY "Engineers can view own tasks"
  ON engineer_tasks FOR SELECT
  USING (
    assigned_to IN (
      SELECT id FROM engineers WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view tasks they assigned" ON engineer_tasks;
CREATE POLICY "Admins can view tasks they assigned"
  ON engineer_tasks FOR SELECT
  USING (
    assigned_by IN (
      SELECT id FROM authorities WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can create tasks" ON engineer_tasks;
CREATE POLICY "Admins can create tasks"
  ON engineer_tasks FOR INSERT
  WITH CHECK (
    assigned_by IN (
      SELECT id FROM authorities WHERE auth_user_id = auth.uid() AND is_active = TRUE
    )
  );

DROP POLICY IF EXISTS "Engineers can update own tasks" ON engineer_tasks;
CREATE POLICY "Engineers can update own tasks"
  ON engineer_tasks FOR UPDATE
  USING (
    assigned_to IN (
      SELECT id FROM engineers WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can update tasks they assigned" ON engineer_tasks;
CREATE POLICY "Admins can update tasks they assigned"
  ON engineer_tasks FOR UPDATE
  USING (
    assigned_by IN (
      SELECT id FROM authorities WHERE auth_user_id = auth.uid() AND is_active = TRUE
    )
  );

-- Master tickets policies
DROP POLICY IF EXISTS "Admins can view master tickets" ON master_tickets;
CREATE POLICY "Admins can view master tickets" ON master_tickets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND (raw_app_meta_data->>'role' = 'admin' OR raw_app_meta_data->>'authority' IS NOT NULL)
        )
    );

-- Audit logs policies
DROP POLICY IF EXISTS "Public can view audit logs" ON ledger_audit_logs;
CREATE POLICY "Public can view audit logs" ON ledger_audit_logs FOR SELECT USING (true);

-- Storage policies
DROP POLICY IF EXISTS "report_photos_public_read" ON storage.objects;
CREATE POLICY "report_photos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'report-photos');

DROP POLICY IF EXISTS "report_photos_anon_upload" ON storage.objects;
CREATE POLICY "report_photos_anon_upload"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'report-photos');

DROP POLICY IF EXISTS "proof_photos_public_read" ON storage.objects;
CREATE POLICY "proof_photos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'proof-photos');

DROP POLICY IF EXISTS "proof_photos_admin_upload" ON storage.objects;
CREATE POLICY "proof_photos_admin_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'proof-photos'
    AND EXISTS (
      SELECT 1 FROM public.authorities
      WHERE auth_user_id = auth.uid() AND is_active = true
    )
  );

DROP POLICY IF EXISTS "inspection_pdfs_public_read" ON storage.objects;
CREATE POLICY "inspection_pdfs_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'inspection-pdfs');

DROP POLICY IF EXISTS "inspection_pdfs_admin_upload" ON storage.objects;
CREATE POLICY "inspection_pdfs_admin_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'inspection-pdfs'
    AND EXISTS (
      SELECT 1 FROM public.authorities
      WHERE auth_user_id = auth.uid() AND is_active = true
    )
  );

-- ────────────────────────────────────────────────────────────
-- 13. Seed Data
-- ────────────────────────────────────────────────────────────

-- Truth Counter
INSERT INTO truth_counter (
  official_collapses, official_source, official_source_url,
  reality_collapses, reality_deaths, reality_injured, reality_source,
  citizen_reports_on_platform
) VALUES (
  42,
  'MoRTH Parliamentary Response 2024',
  'https://data.gov.in/resource/bridge-collapse-data',
  170,
  202,
  441,
  'Newslaundry Media Analysis July 2025',
  0
);

-- Demo Bridges
INSERT INTO bridges (
  name, lat, lng, district, state, address,
  year_built, bridge_type, length_m, width_m, design_load, material,
  seismic_zone, responsible_authority,
  last_inspection_date,
  risk_score, risk_breakdown, status, total_reports
) VALUES
(
  'Dharwad Bypass Bridge',
  15.4589, 75.0078, 'Dharwad', 'Karnataka', 'NH-48 Bypass, Dharwad',
  1979, 'RCC T-Beam', 180.00, 7.50, 'IRC Class A', 'Reinforced Concrete',
  'III', 'Karnataka PWD',
  '2022-08-01',
  88,
  '{"age_factor":22,"citizen_reports":20,"inspection_gap":18,"monsoon_risk":18,"seismic_zone":10}',
  'CRITICAL',
  4
),
(
  'Tungabhadra NH Bridge',
  15.3647, 76.4600, 'Koppal', 'Karnataka', 'NH-50, Tungabhadra River',
  1991, 'PSC Girder', 320.00, 10.00, 'IRC Class AA', 'Pre-stressed Concrete',
  'II', 'NHAI Karnataka',
  '2024-03-10',
  45,
  '{"age_factor":15,"citizen_reports":4,"inspection_gap":5,"monsoon_risk":13,"seismic_zone":2}',
  'MONITOR',
  1
),
(
  'Hubli Railway Overbridge',
  15.3647, 75.1240, 'Hubballi', 'Karnataka', 'Station Road, Hubballi',
  2003, 'Steel Composite', 120.00, 12.00, 'IRC Class A', 'Steel + Concrete',
  'III', 'Indian Railways / HDMC',
  '2025-09-15',
  28,
  '{"age_factor":8,"citizen_reports":0,"inspection_gap":0,"monsoon_risk":7,"seismic_zone":5}',
  'SAFE',
  0
),
(
  'Malaprabha River Bridge NH-67',
  15.7749, 74.9643, 'Dharwad', 'Karnataka', 'NH-67, Malaprabha River',
  1968, 'RCC Arch', 200.00, 6.50, 'IRC Class B', 'Reinforced Concrete',
  'III', 'Karnataka PWD',
  '2021-06-20',
  94,
  '{"age_factor":25,"citizen_reports":21,"inspection_gap":20,"monsoon_risk":17,"seismic_zone":5}',
  'CRITICAL',
  6
),
(
  'Belagavi NH-4 Bridge',
  15.8497, 74.4977, 'Belagavi', 'Karnataka', 'NH-4, Krishna River',
  1985, 'RCC Slab', 240.00, 7.50, 'IRC Class A', 'Reinforced Concrete',
  'III', 'Karnataka PWD',
  '2023-11-05',
  62,
  '{"age_factor":22,"citizen_reports":8,"inspection_gap":12,"monsoon_risk":13,"seismic_zone":5}',
  'WARNING',
  2
);

-- Demo Reports
INSERT INTO reports (bridge_id, bridge_name, reporter_hash, damage_type, severity, description, lat, lng, status, days_unaddressed, created_at)
SELECT b.id, b.name, 'anon_hash_d1a4', 'CRACK', 'DANGEROUS',
       'Large crack visible on pier #2, approximately 4cm wide. Concrete spalling around crack edges.',
       b.lat, b.lng, 'IGNORED', 18, now() - interval '18 days'
FROM bridges b WHERE b.name = 'Dharwad Bypass Bridge';

INSERT INTO reports (bridge_id, bridge_name, reporter_hash, damage_type, severity, description, lat, lng, status, days_unaddressed, created_at)
SELECT b.id, b.name, 'anon_hash_e7b2', 'SPALLING', 'SERIOUS',
       'Concrete spalling visible on underside of deck slab near midspan.',
       b.lat, b.lng, 'PENDING', 45, now() - interval '45 days'
FROM bridges b WHERE b.name = 'Dharwad Bypass Bridge';

INSERT INTO reports (bridge_id, bridge_name, reporter_hash, damage_type, severity, description, lat, lng, status, days_unaddressed, created_at)
SELECT b.id, b.name, 'anon_hash_f3c9', 'FOUNDATION', 'SERIOUS',
       'Water seepage observed near abutment foundation. Soil erosion visible.',
       b.lat, b.lng, 'UNDER_REVIEW', 67, now() - interval '67 days'
FROM bridges b WHERE b.name = 'Dharwad Bypass Bridge';

INSERT INTO reports (bridge_id, bridge_name, reporter_hash, damage_type, severity, description, lat, lng, status, days_unaddressed, created_at)
SELECT b.id, b.name, 'anon_hash_a1d0', 'RAILING_BROKEN', 'VISIBLE',
       'Railing damaged on south side, approximately 3m section missing.',
       b.lat, b.lng, 'ACTION_TAKEN', 0, now() - interval '90 days'
FROM bridges b WHERE b.name = 'Dharwad Bypass Bridge';

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
  'JanaVaani Administration'
)
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- END OF DATABASE SETUP
-- ============================================================