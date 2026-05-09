-- ============================================================
-- K-GRM Migration — Adds escalation, priority, and action log columns
-- Run this AFTER setup_civil_infrastructure.sql
-- Safe to re-run (uses IF NOT EXISTS / DO blocks)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Add K-GRM columns to reports table
-- ────────────────────────────────────────────────────────────

DO $$ BEGIN
  -- K-GRM Priority level (CRITICAL, HIGH, MEDIUM, LOW)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'priority') THEN
    ALTER TABLE reports ADD COLUMN priority TEXT DEFAULT 'MEDIUM';
  END IF;

  -- K-GRM Complaint ID (KA-BLG-2026-00423)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'complaint_id') THEN
    ALTER TABLE reports ADD COLUMN complaint_id TEXT;
  END IF;

  -- Escalation level: MUNICIPAL (default) → DC → MINISTRY
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'escalation_level') THEN
    ALTER TABLE reports ADD COLUMN escalation_level TEXT DEFAULT NULL;
  END IF;

  -- Timestamp when escalated to DC
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'escalated_to_dc_at') THEN
    ALTER TABLE reports ADD COLUMN escalated_to_dc_at TIMESTAMPTZ;
  END IF;

  -- Timestamp when escalated to Ministry
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'escalated_to_ministry_at') THEN
    ALTER TABLE reports ADD COLUMN escalated_to_ministry_at TIMESTAMPTZ;
  END IF;

  -- SLA deadline timestamp (computed from priority)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'sla_deadline') THEN
    ALTER TABLE reports ADD COLUMN sla_deadline TIMESTAMPTZ;
  END IF;

  -- District code for K-GRM district-level analytics
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'district_code') THEN
    ALTER TABLE reports ADD COLUMN district_code TEXT;
  END IF;

  -- Citizen satisfaction rating (1-5 stars, submitted after resolution)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'citizen_rating') THEN
    ALTER TABLE reports ADD COLUMN citizen_rating SMALLINT CHECK (citizen_rating >= 1 AND citizen_rating <= 5);
  END IF;

  -- Citizen rating feedback text
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'citizen_feedback') THEN
    ALTER TABLE reports ADD COLUMN citizen_feedback TEXT;
  END IF;

  -- Score multiplier for K-GRM scoring
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'score_multiplier') THEN
    ALTER TABLE reports ADD COLUMN score_multiplier REAL DEFAULT 1.5;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 2. Engineer Action Logs table (K-GRM Step-by-Step tracking)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS engineer_action_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id         UUID NOT NULL REFERENCES engineer_tasks(id) ON DELETE CASCADE,
  engineer_id     UUID NOT NULL REFERENCES engineers(id) ON DELETE CASCADE,
  action_type     TEXT NOT NULL,
  photo_url       TEXT,
  remark          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_action_logs_task ON engineer_action_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_engineer ON engineer_action_logs(engineer_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_created ON engineer_action_logs(created_at DESC);

-- RLS for action logs
ALTER TABLE IF EXISTS engineer_action_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "action_logs_public_read" ON engineer_action_logs;
CREATE POLICY "action_logs_public_read" ON engineer_action_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "action_logs_authenticated_insert" ON engineer_action_logs;
CREATE POLICY "action_logs_authenticated_insert" ON engineer_action_logs FOR INSERT TO authenticated WITH CHECK (true);

-- ────────────────────────────────────────────────────────────
-- 3. Citizen Scores table (Civic Hero gamification)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS citizen_scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id      UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_score     INT NOT NULL DEFAULT 0,
  reports_count   INT NOT NULL DEFAULT 0,
  validations_count INT NOT NULL DEFAULT 0,
  feedbacks_count INT NOT NULL DEFAULT 0,
  false_reports_count INT NOT NULL DEFAULT 0,
  critical_reports_count INT NOT NULL DEFAULT 0,
  high_reports_count INT NOT NULL DEFAULT 0,
  tier            TEXT DEFAULT 'NEW',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_citizen_scores_user ON citizen_scores(citizen_id);
CREATE INDEX IF NOT EXISTS idx_citizen_scores_total ON citizen_scores(total_score DESC);

-- RLS for citizen scores
ALTER TABLE IF EXISTS citizen_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "citizen_scores_public_read" ON citizen_scores;
CREATE POLICY "citizen_scores_public_read" ON citizen_scores FOR SELECT USING (true);

DROP POLICY IF EXISTS "citizen_scores_authenticated_upsert" ON citizen_scores;
CREATE POLICY "citizen_scores_authenticated_upsert" ON citizen_scores FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "citizen_scores_self_update" ON citizen_scores;
CREATE POLICY "citizen_scores_self_update" ON citizen_scores FOR UPDATE TO authenticated USING (citizen_id = auth.uid());

-- Trigger for updated_at on citizen_scores
DROP TRIGGER IF EXISTS trg_citizen_scores_updated ON citizen_scores;
CREATE TRIGGER trg_citizen_scores_updated
  BEFORE UPDATE ON citizen_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ────────────────────────────────────────────────────────────
-- 4. Indexes for K-GRM escalation queries
-- ────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_reports_priority ON reports(priority);
CREATE INDEX IF NOT EXISTS idx_reports_escalation_level ON reports(escalation_level);
CREATE INDEX IF NOT EXISTS idx_reports_district_code ON reports(district_code);
CREATE INDEX IF NOT EXISTS idx_reports_complaint_id ON reports(complaint_id);
CREATE INDEX IF NOT EXISTS idx_reports_sla_deadline ON reports(sla_deadline);

-- ────────────────────────────────────────────────────────────
-- 5. Add K-GRM jurisdiction level to authorities
-- ────────────────────────────────────────────────────────────

DO $$ BEGIN
  -- Ensure jurisdiction JSONB has 'level' key for RBAC
  -- Levels: MUNICIPAL, DISTRICT_COLLECTOR, MINISTER_OF_WELFARE
  -- This is already handled by the existing jurisdiction JSONB column
  -- No schema change needed, just ensuring the column exists
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'authorities' AND column_name = 'district_code') THEN
    ALTER TABLE authorities ADD COLUMN district_code TEXT;
  END IF;
END $$;

-- ============================================================
-- END OF K-GRM MIGRATION
-- ============================================================
