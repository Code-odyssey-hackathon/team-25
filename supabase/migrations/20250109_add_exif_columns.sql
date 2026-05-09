-- Add EXIF metadata columns to reports table for photo freshness detection

-- Add columns for photo metadata
alter table public.reports 
  add column if not exists photo_taken_at timestamptz,
  add column if not exists photo_lat decimal(10, 8),
  add column if not exists photo_lng decimal(11, 8),
  add column if not exists photo_device_info text,
  add column if not exists exif_verified boolean default false;

-- Index for freshness queries
create index if not exists idx_reports_photo_date on public.reports(photo_taken_at);

-- Index for location-based queries comparing reported vs photo GPS
create index if not exists idx_reports_photo_location on public.reports(photo_lat, photo_lng);

-- Update RLS policies to allow admins to see EXIF data
-- (Citizens can only see their own reports, this is already handled by existing policies)
