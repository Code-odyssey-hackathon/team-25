import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// POST /api/upvote — Toggle upvote ("Me Too")
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
    }

    const { report_id } = await request.json();
    if (!report_id) {
      return NextResponse.json({ error: "report_id is required", success: false }, { status: 400 });
    }

    // Check if already upvoted
    const { data: existing } = await supabase
      .from("upvotes")
      .select("id")
      .eq("report_id", report_id)
      .eq("user_id", user.id)
      .single();

    if (existing) {
      // Remove upvote
      const { error } = await supabase.from("upvotes").delete().eq("id", existing.id);
      if (error) throw error;
      return NextResponse.json({ action: "removed", success: true });
    } else {
      // Add upvote
      const { error } = await supabase.from("upvotes").insert({ report_id, user_id: user.id });
      if (error) throw error;
      return NextResponse.json({ action: "added", success: true });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to process upvote";
    return NextResponse.json({ error: msg, success: false }, { status: 500 });
  }
}
