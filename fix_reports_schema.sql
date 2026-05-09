-- ═══════════════════════════════════════════════════════════════
-- K-GRM Schema Migration — Add Missing Columns to `reports`
-- ═══════════════════════════════════════════════════════════════
-- This migration adds the columns referenced by the frontend code
-- but missing from the current Supabase schema.
--
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════

-- ── 1. K-GRM Complaint Tracking Columns ──────────────────────

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS complaint_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'MEDIUM',
  ADD COLUMN IF NOT EXISTS district_code TEXT,
  ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS score_multiplier NUMERIC(3,1) DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS escalation_level TEXT,
  ADD COLUMN IF NOT EXISTS escalated_to_dc_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS escalated_to_ministry_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auto_escalated_at TIMESTAMPTZ;

-- ── 2. Perceptual Hashing / Dedup Columns ────────────────────

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS perceptual_hash TEXT,
  ADD COLUMN IF NOT EXISTS difference_hash TEXT,
  ADD COLUMN IF NOT EXISTS clip_embedding FLOAT8[];

-- ── 3. Indexes for Performance ───────────────────────────────

-- Fast lookup by complaint ID
CREATE INDEX IF NOT EXISTS idx_reports_complaint_id ON public.reports (complaint_id);

-- Fast lookup by perceptual hash for near-duplicate detection
CREATE INDEX IF NOT EXISTS idx_reports_perceptual_hash ON public.reports (perceptual_hash)
  WHERE perceptual_hash IS NOT NULL;

-- Escalation queries (filter by level + status)
CREATE INDEX IF NOT EXISTS idx_reports_escalation ON public.reports (escalation_level, status, created_at);

-- District-based filtering
CREATE INDEX IF NOT EXISTS idx_reports_district ON public.reports (district_code)
  WHERE district_code IS NOT NULL;

-- Priority-based SLA queries
CREATE INDEX IF NOT EXISTS idx_reports_priority_sla ON public.reports (priority, sla_deadline)
  WHERE status IN ('PENDING', 'UNDER_REVIEW');

-- ── 4. Refresh PostgREST Schema Cache ────────────────────────
-- This is CRITICAL — without this, PostgREST will return:
-- "Could not find the 'complaint_id' column in the schema cache"

NOTIFY pgrst, 'reload schema';

-- ── 5. Verify ────────────────────────────────────────────────
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'reports'
  AND column_name IN (
    'complaint_id', 'priority', 'district_code', 'sla_deadline',
    'perceptual_hash', 'difference_hash', 'escalation_level'
  )
ORDER BY column_name;
