-- ============================================================
-- Add MD5 hash for duplicate detection to reports table
-- ============================================================

-- Add md5_hash column to reports table
ALTER TABLE reports 
ADD COLUMN md5_hash TEXT;

-- Create index for fast duplicate lookups
CREATE INDEX idx_reports_md5_hash ON reports(md5_hash) WHERE md5_hash IS NOT NULL;

-- Add constraint to ensure valid MD5 format (32 hexadecimal characters)
ALTER TABLE reports 
ADD CONSTRAINT valid_md5_format CHECK (md5_hash ~ '^[a-f0-9]{32}$' OR md5_hash IS NULL);

-- Add comment to document the purpose
COMMENT ON COLUMN reports.md5_hash IS 'MD5 hash of uploaded photo for duplicate detection. Prevents exact duplicate uploads.';