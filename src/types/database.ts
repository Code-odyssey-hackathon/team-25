// =============================================================================
// JanaVaani — Supabase Database Types
// Mirrors the SQL schema defined in Step 1
// =============================================================================

export type IssueCategory =
  | "pothole"
  | "garbage"
  | "water_leak"
  | "streetlight"
  | "road_damage"
  | "drainage"
  | "encroachment"
  | "other";

export type ReportStatus =
  | "submitted"
  | "acknowledged"
  | "in_progress"
  | "resolved"
  | "rejected";

export type UserRole = "citizen" | "admin" | "worker";

// ---------------------------------------------------------------------------
// Table Row Types
// ---------------------------------------------------------------------------

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  ward: string | null;
  department: string | null;
  avatar_url: string | null;
  language: "en" | "hi" | "kn";
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  user_id: string;

  // Content
  title: string;
  description: string;
  image_url: string;
  proof_url: string | null;

  // AI Classification & Semantic Intelligence
  category: IssueCategory;
  ai_confidence: number | null;
  ai_summary: string | null;
  ai_severity: number | null;
  embedding: number[] | null;
  master_ticket_id: string | null;

  // Geospatial
  latitude: number;
  longitude: number;
  address: string | null;
  ward: string | null;

  // Scoring
  priority_score: number;
  upvote_count: number;

  // Lifecycle
  status: ReportStatus;
  assigned_to: string | null;

  // SLA
  acknowledged_at: string | null;
  resolved_at: string | null;
  sla_hours: number | null;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Joined relations (optional)
  profiles?: Profile;
  assigned_worker?: Profile;
}

export interface Upvote {
  id: string;
  report_id: string;
  user_id: string;
  created_at: string;
}

export interface Assignment {
  id: string;
  report_id: string;
  worker_id: string;
  assigned_by: string;
  notes: string | null;
  sms_sent: boolean;
  sms_sid: string | null;
  created_at: string;

  // Joined relations (optional)
  report?: Report;
  worker?: Profile;
}

// ---------------------------------------------------------------------------
// Insert Types (omit server-generated fields)
// ---------------------------------------------------------------------------

export type ReportInsert = Omit<
  Report,
  | "id"
  | "priority_score"
  | "upvote_count"
  | "status"
  | "assigned_to"
  | "acknowledged_at"
  | "resolved_at"
  | "sla_hours"
  | "created_at"
  | "updated_at"
  | "profiles"
  | "assigned_worker"
>;

export type ReportUpdate = Partial<
  Pick<
    Report,
    | "title"
    | "description"
    | "category"
    | "status"
    | "proof_url"
    | "assigned_to"
    | "ward"
    | "address"
    | "ai_severity"
    | "ai_confidence"
    | "ai_summary"
  >
>;

// ---------------------------------------------------------------------------
// Dashboard / View Types
// ---------------------------------------------------------------------------

export interface WardLeaderboard {
  ward: string;
  total_reports: number;
  resolved_count: number;
  avg_sla_hours: number | null;
  resolution_rate: number;
}

export interface CategoryStat {
  category: IssueCategory;
  count: number;
  resolved: number;
  avg_priority: number;
}
