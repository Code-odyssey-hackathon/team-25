/**
 * Migration Script for Duplicate Detection
 * 
 * This script displays the SQL needed to add MD5 hash support to the reports table.
 * Run this script to see the SQL you need to run in your Supabase SQL Editor.
 */

console.log('🚀 Duplicate Detection Migration Setup\n');
console.log('📋 Please run the following SQL in your Supabase SQL Editor:');
console.log('https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new\n');

const migrationSQL = `-- ============================================================
-- Add MD5 hash for duplicate detection to reports table
-- ============================================================

-- Add md5_hash column to reports table
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS md5_hash TEXT;

-- Create index for fast duplicate lookups
CREATE INDEX IF NOT EXISTS idx_reports_md5_hash ON reports(md5_hash) WHERE md5_hash IS NOT NULL;

-- Add constraint to ensure valid MD5 format (32 hexadecimal characters)
ALTER TABLE reports DROP CONSTRAINT IF EXISTS valid_md5_format;
ALTER TABLE reports 
ADD CONSTRAINT valid_md5_format CHECK (md5_hash ~ '^[a-f0-9]{32}$' OR md5_hash IS NULL);

-- Add comment to document the purpose
COMMENT ON COLUMN reports.md5_hash IS 'MD5 hash of uploaded photo for duplicate detection. Prevents exact duplicate uploads.';`;

console.log(migrationSQL);
console.log('\n✅ After running the SQL, your duplicate detection will be active!');
console.log('\n📝 What this migration does:');
console.log('   - Adds md5_hash column to store file hashes');
console.log('   - Creates index for fast duplicate lookups');
console.log('   - Adds constraint to ensure valid MD5 format');
console.log('   - Documents the purpose for future reference');
console.log('\n🎯 The code changes are already complete in:');
console.log('   - src/lib/hashUtils.js (new file)');
console.log('   - src/lib/reports.js (updated)');
console.log('   - supabase/migrations/20260509_add_duplicate_detection.sql (new file)');