// =============================================================================
// JanaVaani — Application Constants
// =============================================================================

import type { IssueCategory, ReportStatus } from "@/types";

// ---------------------------------------------------------------------------
// Issue Categories — Labels, Colors, Icons
// ---------------------------------------------------------------------------

export const CATEGORY_CONFIG: Record<
  IssueCategory,
  { label: string; emoji: string; color: string; markerColor: string }
> = {
  pothole: {
    label: "Pothole",
    emoji: "🕳️",
    color: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    markerColor: "#f97316",
  },
  garbage: {
    label: "Garbage",
    emoji: "🗑️",
    color: "bg-green-500/10 text-green-500 border-green-500/20",
    markerColor: "#22c55e",
  },
  water_leak: {
    label: "Water Leak",
    emoji: "💧",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    markerColor: "#3b82f6",
  },
  streetlight: {
    label: "Streetlight",
    emoji: "💡",
    color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    markerColor: "#eab308",
  },
  road_damage: {
    label: "Road Damage",
    emoji: "🚧",
    color: "bg-red-500/10 text-red-500 border-red-500/20",
    markerColor: "#ef4444",
  },
  drainage: {
    label: "Drainage",
    emoji: "🌊",
    color: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    markerColor: "#06b6d4",
  },
  encroachment: {
    label: "Encroachment",
    emoji: "🚷",
    color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    markerColor: "#a855f7",
  },
  other: {
    label: "Other",
    emoji: "📋",
    color: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    markerColor: "#6b7280",
  },
};

// ---------------------------------------------------------------------------
// Report Status — Labels, Colors
// ---------------------------------------------------------------------------

export const STATUS_CONFIG: Record<
  ReportStatus,
  { label: string; color: string; dotColor: string }
> = {
  submitted: {
    label: "Submitted",
    color: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    dotColor: "bg-slate-400",
  },
  acknowledged: {
    label: "Acknowledged",
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    dotColor: "bg-blue-400",
  },
  in_progress: {
    label: "In Progress",
    color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    dotColor: "bg-amber-400",
  },
  resolved: {
    label: "Resolved",
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    dotColor: "bg-emerald-400",
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-500/10 text-red-400 border-red-500/20",
    dotColor: "bg-red-400",
  },
};

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export const NAV_ITEMS = [
  { href: "/", label: "Map", icon: "Map" as const },
  { href: "/report", label: "Report", icon: "Camera" as const },
  { href: "/dashboard", label: "Dashboard", icon: "BarChart3" as const },
  { href: "/worker", label: "Tasks", icon: "ClipboardList" as const },
] as const;

export const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Admin", icon: "Shield" as const },
] as const;

// ---------------------------------------------------------------------------
// Map Defaults
// ---------------------------------------------------------------------------

export const MAP_DEFAULTS = {
  center: { lat: 12.9716, lng: 77.5946 } as const, // Bangalore
  zoom: 13,
  maxZoom: 19,
  minZoom: 5,
  tileUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  tileAttribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  clusterRadius: 60,
  nearbyRadiusMeters: 500,
};

// ---------------------------------------------------------------------------
// App Config
// ---------------------------------------------------------------------------

export const APP_CONFIG = {
  name: "JanaVaani",
  tagline: "Voice Of The People",
  description:
    "Unified AI-Powered Civic Grievance Intelligence Platform.",
  maxImageSizeMB: 10,
  maxImageSizeBytes: 10 * 1024 * 1024,
  allowedImageTypes: ["image/jpeg", "image/png", "image/webp"],
  defaultPageSize: 20,
  slaTargetHours: 48,
};
