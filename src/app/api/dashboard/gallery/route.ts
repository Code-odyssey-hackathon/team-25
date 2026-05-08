import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// GET /api/dashboard/gallery — Before/After gallery (FR3)
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("reports")
      .select("id, title, category, image_url, proof_url, created_at, resolved_at, sla_hours, ward")
      .eq("status", "resolved")
      .not("proof_url", "is", null)
      .order("resolved_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return NextResponse.json({ data: data || [], success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch gallery";
    return NextResponse.json({ error: msg, success: false }, { status: 500 });
  }
}
