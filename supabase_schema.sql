-- =============================================================================
-- JanaVaani — Supabase Database Schema
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- For audit hashing

-- ---------------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------------

CREATE TYPE issue_category AS ENUM (
  'pothole',
  'garbage',
  'water_leak',
  'streetlight',
  'road_damage',
  'drainage',
  'encroachment',
  'other'
);

CREATE TYPE report_status AS ENUM (
  'submitted',
  'acknowledged',
  'in_progress',
  'resolved',
  'rejected'
);

CREATE TYPE user_role AS ENUM (
  'citizen',
  'admin',
  'worker'
);

-- ---------------------------------------------------------------------------
-- 2. Tables
-- ---------------------------------------------------------------------------

-- Profiles Table (Linked to auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role DEFAULT 'citizen' NOT NULL,
  ward TEXT,
  department TEXT,
  avatar_url TEXT,
  language TEXT DEFAULT 'en' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Reports Table
CREATE TABLE public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Content
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  proof_url TEXT,
  
  -- AI Classification & Semantic Intelligence
  category issue_category DEFAULT 'other' NOT NULL,
  ai_confidence FLOAT,
  ai_summary TEXT,
  ai_severity INTEGER DEFAULT 5,
  embedding vector(768), -- For Google Gemini Text Embedding models
  master_ticket_id UUID REFERENCES public.reports(id), -- Self-reference for clustering
  
  -- Geospatial
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  ward TEXT,
  
  -- Scoring
  priority_score INTEGER DEFAULT 5 NOT NULL,
  upvote_count INTEGER DEFAULT 0 NOT NULL,
  
  -- Lifecycle
  status report_status DEFAULT 'submitted' NOT NULL,
  assigned_to UUID REFERENCES public.profiles(id),
  
  -- SLA
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  sla_hours INTEGER,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Upvotes Table
CREATE TABLE public.upvotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(report_id, user_id)
);

-- Assignments Table
CREATE TABLE public.assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
  worker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID REFERENCES public.profiles(id) NOT NULL,
  notes TEXT,
  sms_sent BOOLEAN DEFAULT FALSE NOT NULL,
  sms_sid TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ---------------------------------------------------------------------------
-- 3. Triggers & Functions
-- ---------------------------------------------------------------------------

-- Updated At Trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_report_updated BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'citizen')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Dynamic Priority Scoring Function
-- Priority Score = AI Severity + (Upvote Count * 2)
CREATE OR REPLACE FUNCTION public.calculate_priority_score()
RETURNS TRIGGER AS $$
DECLARE
  v_upvote_count INTEGER;
  v_ai_severity INTEGER;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    SELECT count(*) INTO v_upvote_count FROM public.upvotes WHERE report_id = NEW.report_id;
    SELECT ai_severity INTO v_ai_severity FROM public.reports WHERE id = NEW.report_id;
    
    UPDATE public.reports 
    SET 
      upvote_count = v_upvote_count,
      priority_score = v_ai_severity + (v_upvote_count * 2)
    WHERE id = NEW.report_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    SELECT count(*) INTO v_upvote_count FROM public.upvotes WHERE report_id = OLD.report_id;
    SELECT ai_severity INTO v_ai_severity FROM public.reports WHERE id = OLD.report_id;
    
    UPDATE public.reports 
    SET 
      upvote_count = v_upvote_count,
      priority_score = v_ai_severity + (v_upvote_count * 2)
    WHERE id = OLD.report_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_upvote_change AFTER INSERT OR DELETE ON public.upvotes FOR EACH ROW EXECUTE PROCEDURE public.calculate_priority_score();

-- SLA Calculation on Resolution
CREATE OR REPLACE FUNCTION public.handle_report_resolution()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    NEW.resolved_at = NOW();
    NEW.sla_hours = EXTRACT(EPOCH FROM (NEW.resolved_at - NEW.created_at)) / 3600;
  ELSIF NEW.status = 'acknowledged' AND OLD.status != 'acknowledged' THEN
    NEW.acknowledged_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_report_resolution BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE PROCEDURE public.handle_report_resolution();

-- ---------------------------------------------------------------------------
-- 4. Row Level Security (RLS)
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Reports Policies
CREATE POLICY "Reports are viewable by everyone" ON public.reports FOR SELECT USING (true);
CREATE POLICY "Citizens can create reports" ON public.reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Citizens can update own reports" ON public.reports FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins/Workers can update assigned reports" ON public.reports FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND (role = 'admin' OR (role = 'worker' AND id = reports.assigned_to))
  )
);

-- Upvotes Policies
CREATE POLICY "Upvotes are viewable by everyone" ON public.upvotes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can toggle upvotes" ON public.upvotes FOR ALL USING (auth.uid() = user_id);

-- Assignments Policies
CREATE POLICY "Assignments are viewable by admins and involved workers" ON public.assignments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND (role = 'admin' OR (role = 'worker' AND id = assignments.worker_id))
  )
);
CREATE POLICY "Only admins can manage assignments" ON public.assignments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ---------------------------------------------------------------------------
-- 5. Views
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.ward_leaderboard AS
SELECT 
  ward,
  count(*) as total_reports,
  count(*) FILTER (WHERE status = 'resolved') as resolved_count,
  round(avg(sla_hours)::numeric, 1) as avg_sla_hours,
  round((count(*) FILTER (WHERE status = 'resolved')::float / count(*)::float * 100)::numeric, 1) as resolution_rate
FROM public.reports
WHERE ward IS NOT NULL
GROUP BY ward
ORDER BY resolution_rate DESC, avg_sla_hours ASC;

-- ---------------------------------------------------------------------------
-- 6. Storage Buckets
-- ---------------------------------------------------------------------------

-- Note: Storage buckets must be created via the dashboard or Supabase CLI, 
-- but we can define the policies here.

-- Reports Bucket Policies
-- (Assume bucket 'reports' exists)
-- CREATE POLICY "Report images are public" ON storage.objects FOR SELECT USING (bucket_id = 'reports');
-- CREATE POLICY "Users can upload report images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'reports' AND auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- 7. Semantic Search & Clustering
-- ---------------------------------------------------------------------------

-- Semantic Search Function (Clustering)
CREATE OR REPLACE FUNCTION match_reports (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  min_lat float,
  max_lat float,
  min_lng float,
  max_lng float
)
RETURNS TABLE (
  id uuid,
  title text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    reports.id,
    reports.title,
    1 - (reports.embedding <=> query_embedding) AS similarity
  FROM public.reports
  WHERE (reports.latitude BETWEEN min_lat AND max_lat)
    AND (reports.longitude BETWEEN min_lng AND max_lng)
    AND 1 - (reports.embedding <=> query_embedding) > match_threshold
    AND reports.master_ticket_id IS NULL -- Only match against master tickets
  ORDER BY reports.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ---------------------------------------------------------------------------
-- 8. Audit Ledger (Blockchain Simulation)
-- ---------------------------------------------------------------------------

CREATE TABLE public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE,
  status_from report_status,
  status_to report_status,
  changed_by UUID REFERENCES public.profiles(id),
  state_hash TEXT NOT NULL, -- Cryptographic seal simulation
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE OR REPLACE FUNCTION public.log_report_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.audit_logs (report_id, status_from, status_to, changed_by, state_hash)
    VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid(),
      encode(digest(concat(NEW.id::text, NEW.status::text, now()::text), 'sha256'), 'hex')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_report_status_change AFTER UPDATE ON public.reports FOR EACH ROW EXECUTE PROCEDURE public.log_report_change();

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Audit logs are viewable by everyone" ON public.audit_logs FOR SELECT USING (true);
