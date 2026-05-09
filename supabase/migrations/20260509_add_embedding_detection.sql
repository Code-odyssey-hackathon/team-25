-- ============================================================
-- Full Embedding-Based Duplicate Detection System
-- Includes: Exact duplicates (MD5), Near-duplicates (Perceptual), Semantic (CLIP)
-- ============================================================

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Add MD5 hash column for exact duplicate detection
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS md5_hash TEXT;

-- Add columns for perceptual hashing (near-duplicate detection)
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS phash BIGINT,
ADD COLUMN IF NOT EXISTS dhash BIGINT;

-- Add column for CLIP embeddings (semantic similarity)
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS embedding vector(512);

-- Create indexes for fast duplicate detection
CREATE INDEX IF NOT EXISTS idx_reports_md5_hash ON reports(md5_hash) WHERE md5_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reports_phash ON reports USING hash(phash) WHERE phash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reports_embedding ON reports USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Add constraints for data integrity
ALTER TABLE reports 
DROP CONSTRAINT IF EXISTS valid_md5_format;
ALTER TABLE reports 
ADD CONSTRAINT valid_md5_format CHECK (md5_hash ~ '^[a-f0-9]{32}$' OR md5_hash IS NULL);

-- Add comments for documentation
COMMENT ON COLUMN reports.md5_hash IS 'MD5 hash for exact duplicate detection';
COMMENT ON COLUMN reports.phash IS 'Perceptual hash for near-duplicate detection (catches resized/cropped images)';
COMMENT ON COLUMN reports.dhash IS 'Difference hash for near-duplicate detection';
COMMENT ON COLUMN reports.embedding IS 'CLIP vector embedding for semantic similarity search (512-dimensional)';

-- Create function for vector similarity search
CREATE OR REPLACE FUNCTION find_similar_images(
  query_embedding vector(512),
  similarity_threshold FLOAT DEFAULT 0.85,
  match_count INT DEFAULT 10,
  exclude_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  photo_url TEXT,
  similarity FLOAT,
  issue_type TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    reports.id,
    reports.photo_url,
    1 - (reports.embedding <=> query_embedding) as similarity,
    reports.issue_type,
    reports.created_at
  FROM reports
  WHERE reports.embedding IS NOT NULL
    AND (exclude_id IS NULL OR reports.id != exclude_id)
    AND (1 - (reports.embedding <=> query_embedding)) >= similarity_threshold
  ORDER BY reports.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create function for near-duplicate search using perceptual hashes
CREATE OR REPLACE FUNCTION find_near_duplicates(
  query_phash BIGINT,
  threshold INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  photo_url TEXT,
  hamming_distance INT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    reports.id,
    reports.photo_url,
    BIT_COUNT(query_phash # reports.phash) as hamming_distance,
    reports.created_at
  FROM reports
  WHERE reports.phash IS NOT NULL
    AND BIT_COUNT(query_phash # reports.phash) <= threshold
  ORDER BY BIT_COUNT(query_phash # reports.phash)
  LIMIT 20;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION find_similar_images TO authenticated;
GRANT EXECUTE ON FUNCTION find_near_duplicates TO authenticated;