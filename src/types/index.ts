// =============================================================================
// JanaVaani — Shared Application Types
// =============================================================================

export * from "./database";

// ---------------------------------------------------------------------------
// Gemini AI Response Types
// ---------------------------------------------------------------------------

export interface AiClassification {
  category: string;
  confidence: number;
  severity: number; // 1-10
  summary: string;
  suggested_title: string;
}

export interface AiAuditResult {
  is_plausible: boolean;
  reasoning: string;
  adjusted_severity: number | null;
}

// ---------------------------------------------------------------------------
// Geolocation
// ---------------------------------------------------------------------------

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
}

// ---------------------------------------------------------------------------
// Map Types
// ---------------------------------------------------------------------------

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
}

// ---------------------------------------------------------------------------
// API Response Wrappers
// ---------------------------------------------------------------------------

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
}

// ---------------------------------------------------------------------------
// Filter / Query Types
// ---------------------------------------------------------------------------

export interface ReportFilters {
  category?: string;
  status?: string;
  ward?: string;
  search?: string;
  sortBy?: "priority_score" | "created_at" | "upvote_count";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

// ---------------------------------------------------------------------------
// i18n
// ---------------------------------------------------------------------------

export type SupportedLanguage = "en" | "hi" | "kn";

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: "English",
  hi: "हिन्दी",
  kn: "ಕನ್ನಡ",
};
