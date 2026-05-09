-- ============================================================
-- Task Evidence Photos Migration
-- Mandatory image upload for engineer task updates
-- Run this AFTER setup_civil_infrastructure.sql AND setup_kgrm_migration.sql
-- Safe to re-run (uses IF NOT EXISTS / DO blocks)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. task_evidence_images — Relational audit trail
-- Maps each image to its task_id, engineer (user) ID, timestamp
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS task_evidence_images (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id           UUID NOT NULL REFERENCES engineer_tasks(id) ON DELETE CASCADE,
  engineer_id       UUID NOT NULL REFERENCES engineers(id) ON DELETE CASCADE,
  -- File metadata
  file_name         TEXT NOT NULL,
  file_size         INTEGER NOT NULL,            -- bytes
  mime_type         TEXT NOT NULL,
  storage_path      TEXT NOT NULL,                -- Supabase storage path
  public_url        TEXT,                         -- CDN-accessible URL
  -- Categorisation
  evidence_type     TEXT NOT NULL DEFAULT 'STATUS_UPDATE',
    -- CONSTRAINT: STATUS_UPDATE | MILESTONE_COMPLETION | FIELD_VISIT | ASSESSMENT | WORK_PROGRESS | WORK_COMPLETE
  -- Validation metadata
  is_validated      BOOLEAN NOT NULL DEFAULT FALSE,
  validation_result JSONB DEFAULT '{}',           -- AI/manual validation output
  -- EXIF / provenance
  exif_data         JSONB DEFAULT '{}',           -- Device info, GPS, date taken
  -- Audit trail
  uploaded_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Links to the action log entry that triggered this upload (nullable)
  action_log_id     UUID REFERENCES engineer_action_logs(id) ON DELETE SET NULL,
  -- Soft-delete support
  is_deleted        BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at        TIMESTAMPTZ
);

-- ────────────────────────────────────────────────────────────
-- 2. Indexes for performant queries
-- ────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_evidence_task      ON task_evidence_images(task_id);
CREATE INDEX IF NOT EXISTS idx_evidence_engineer   ON task_evidence_images(engineer_id);
CREATE INDEX IF NOT EXISTS idx_evidence_type       ON task_evidence_images(evidence_type);
CREATE INDEX IF NOT EXISTS idx_evidence_uploaded    ON task_evidence_images(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_not_deleted ON task_evidence_images(is_deleted) WHERE is_deleted = FALSE;

-- ────────────────────────────────────────────────────────────
-- 3. RLS Policies
-- ────────────────────────────────────────────────────────────

ALTER TABLE IF EXISTS task_evidence_images ENABLE ROW LEVEL SECURITY;

-- Public read for audit transparency
DROP POLICY IF EXISTS "evidence_images_public_read" ON task_evidence_images;
CREATE POLICY "evidence_images_public_read" ON task_evidence_images
  FOR SELECT USING (is_deleted = FALSE);

-- Authenticated users can insert (engineer uploads)
DROP POLICY IF EXISTS "evidence_images_authenticated_insert" ON task_evidence_images;
CREATE POLICY "evidence_images_authenticated_insert" ON task_evidence_images
  FOR INSERT TO authenticated WITH CHECK (true);

-- Engineers can soft-delete their own uploads
DROP POLICY IF EXISTS "evidence_images_self_update" ON task_evidence_images;
CREATE POLICY "evidence_images_self_update" ON task_evidence_images
  FOR UPDATE TO authenticated USING (true);

-- ────────────────────────────────────────────────────────────
-- 4. Storage Bucket for task evidence photos
-- ────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-evidence',
  'task-evidence',
  true,
  10485760,  -- 10MB limit for high-res field photos
  ARRAY['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: public read
DROP POLICY IF EXISTS "task_evidence_public_read" ON storage.objects;
CREATE POLICY "task_evidence_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'task-evidence');

-- Storage RLS: authenticated engineers can upload
DROP POLICY IF EXISTS "task_evidence_auth_upload" ON storage.objects;
CREATE POLICY "task_evidence_auth_upload" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'task-evidence');

-- Storage RLS: authenticated engineers can delete their own uploads
DROP POLICY IF EXISTS "task_evidence_auth_delete" ON storage.objects;
CREATE POLICY "task_evidence_auth_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'task-evidence');

-- ────────────────────────────────────────────────────────────
-- 5. Add evidence_required flag to engineer_tasks (backward-compatible)
-- ────────────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'engineer_tasks'
                 AND column_name = 'evidence_required') THEN
    ALTER TABLE engineer_tasks ADD COLUMN evidence_required BOOLEAN NOT NULL DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'engineer_tasks'
                 AND column_name = 'evidence_count') THEN
    ALTER TABLE engineer_tasks ADD COLUMN evidence_count INTEGER NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'engineer_tasks'
                 AND column_name = 'last_evidence_at') THEN
    ALTER TABLE engineer_tasks ADD COLUMN last_evidence_at TIMESTAMPTZ;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 6. Trigger: Auto-update evidence_count on engineer_tasks
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_task_evidence_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE engineer_tasks
    SET evidence_count = evidence_count + 1,
        last_evidence_at = NEW.uploaded_at
    WHERE id = NEW.task_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' AND NEW.is_deleted = TRUE AND OLD.is_deleted = FALSE THEN
    UPDATE engineer_tasks
    SET evidence_count = GREATEST(evidence_count - 1, 0)
    WHERE id = NEW.task_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_evidence_count ON task_evidence_images;
CREATE TRIGGER trg_update_evidence_count
  AFTER INSERT OR UPDATE ON task_evidence_images
  FOR EACH ROW EXECUTE FUNCTION update_task_evidence_count();

-- ============================================================
-- END OF TASK EVIDENCE MIGRATION
-- ============================================================
