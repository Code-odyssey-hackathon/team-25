-- ═══════════════════════════════════════════════════════════════
-- K-GRM Data Cleanup — Consolidation and Test Data Removal
-- ═══════════════════════════════════════════════════════════════
-- This script cleans up messy test entries and consolidates
-- Hubli variations into the official "Dharwad" (DWD) district.
--
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Consolidate Hubli variations to Dharwad (DWD) ─────────
-- This fixes "Hublii", "Hubliiii", "Hubl", etc.
UPDATE public.reports
SET 
  city = 'Dharwad',
  district_code = 'DWD'
WHERE 
  city ILIKE 'Hubl%' 
  OR city ILIKE 'Hubballi%';

-- ── 2. Remove obvious test data ──────────────────────────────
DELETE FROM public.reports
WHERE 
  city = 'Test City'
  OR city = 'Unknown'
  OR description ILIKE '%test%';

-- ── 3. Normalize existing district names ─────────────────────
-- Ensure that if city matches a district name exactly, it has the code
UPDATE public.reports SET district_code = 'BGM' WHERE city = 'Belagavi' AND district_code IS NULL;
UPDATE public.reports SET district_code = 'DWD' WHERE city = 'Dharwad' AND district_code IS NULL;
UPDATE public.reports SET district_code = 'BLR' WHERE city = 'Bengaluru Urban' AND district_code IS NULL;
UPDATE public.reports SET district_code = 'MYS' WHERE city = 'Mysuru' AND district_code IS NULL;

-- ── 4. Verify the cleanup ────────────────────────────────────
SELECT district_code, city, COUNT(*) as report_count
FROM public.reports
GROUP BY district_code, city
ORDER BY report_count DESC;
