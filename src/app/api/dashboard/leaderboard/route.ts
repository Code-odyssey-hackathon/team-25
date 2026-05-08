import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// GET /api/dashboard/leaderboard — Ward SLA rankings (FR3)
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("ward_leaderboard").select("*");
    if (error) throw error;
    return NextResponse.json({ data: data || [], success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch leaderboard";
    return NextResponse.json({ error: msg, success: false }, { status: 500 });
  }
}
