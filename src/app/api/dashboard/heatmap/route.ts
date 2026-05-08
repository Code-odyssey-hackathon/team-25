import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// GET /api/dashboard/heatmap — Geospatial data for heatmap (FR3)
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("reports")
      .select("latitude, longitude, priority_score, category, status")
      .neq("status", "resolved")
      .not("latitude", "is", null)
      .not("longitude", "is", null);

    if (error) throw error;

    const points = (data || []).map((r) => ({
      lat: r.latitude,
      lng: r.longitude,
      intensity: r.priority_score || 1,
      category: r.category,
    }));

    return NextResponse.json({ data: points, success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch heatmap data";
    return NextResponse.json({ error: msg, success: false }, { status: 500 });
  }
}
