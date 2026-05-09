-- Add AI and Voice fields to reports table
ALTER TABLE reports ADD COLUMN IF NOT EXISTS audio_url text;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS ai_transcript text;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS upvotes_count integer DEFAULT 0;

-- Create table for tracking upvotes
CREATE TABLE IF NOT EXISTS report_upvotes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id uuid REFERENCES reports(id) ON DELETE CASCADE,
    citizen_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(report_id, citizen_id)
);

-- RLS policies for upvotes
ALTER TABLE report_upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view upvotes" ON report_upvotes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can upvote" ON report_upvotes
    FOR INSERT WITH CHECK (auth.uid() = citizen_id);

CREATE POLICY "Users can remove their own upvote" ON report_upvotes
    FOR DELETE USING (auth.uid() = citizen_id);
