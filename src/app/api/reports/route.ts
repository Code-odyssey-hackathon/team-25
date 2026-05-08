import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getTextEmbedding } from "@/lib/gemini";

// GET /api/reports — Fetch all reports with filters
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const ward = searchParams.get("ward");
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    let query = supabase.from("reports").select("*, profiles!reports_user_id_fkey(full_name, avatar_url)", { count: "exact" });

    if (category) query = query.eq("category", category);
    if (status) query = query.eq("status", status);
    if (ward) query = query.eq("ward", ward);

    query = query.order(sortBy, { ascending: sortOrder === "asc" });
    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({ data, total: count, page, pageSize, success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch reports";
    return NextResponse.json({ error: msg, success: false }, { status: 500 });
  }
}

// POST /api/reports — Create a new report with semantic deduplication (FR2)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
    }

    const body = await request.json();
    const { 
      title, 
      description, 
      image_url, 
      category, 
      latitude, 
      longitude, 
      address, 
      ward, 
      ai_confidence, 
      ai_severity, 
      ai_summary 
    } = body;

    if (!title || !image_url || !latitude || !longitude) {
      return NextResponse.json({ error: "Missing required fields: title, image_url, latitude, longitude", success: false }, { status: 400 });
    }

    // 1. Generate Semantic Embedding for the report
    const embeddingText = `${title}. ${description || ""}`;
    let embedding: number[] | null = null;
    try {
      embedding = await getTextEmbedding(embeddingText);
    } catch (err) {
      console.error("Embedding generation failed:", err);
      // Fallback: Continue without embedding if AI service is down
    }

    // 2. Semantic Deduplication Logic (Master Ticket Matching)
    let masterTicketId = null;
    if (embedding) {
      // Define a search box (~500m radius)
      const radius = 0.005; // ~500m in lat/lng degrees
      const { data: matches, error: matchError } = await supabase.rpc("match_reports", {
        query_embedding: embedding,
        match_threshold: 0.94, // 94% similarity as per PRD
        match_count: 1,
        min_lat: latitude - radius,
        max_lat: latitude + radius,
        min_lng: longitude - radius,
        max_lng: longitude + radius,
      });

      if (!matchError && matches && matches.length > 0) {
        masterTicketId = matches[0].id;
        console.log(`Semantic match found! Linking to master ticket: ${masterTicketId}`);
      }
    }

    // 3. Insert the new report
    const { data, error } = await supabase.from("reports").insert({
      user_id: user.id,
      title,
      description: description || "",
      image_url,
      category: category || "other",
      latitude,
      longitude,
      address: address || null,
      ward: ward || null,
      ai_confidence: ai_confidence || null,
      ai_severity: ai_severity || null,
      ai_summary: ai_summary || null,
      embedding: embedding || null,
      master_ticket_id: masterTicketId,
      status: masterTicketId ? "acknowledged" : "submitted", // Auto-acknowledge if it's a known issue
    }).select().single();

    if (error) throw error;

    return NextResponse.json({ 
      data, 
      isDuplicate: !!masterTicketId,
      masterTicketId,
      success: true 
    }, { status: 201 });
  } catch (err) {
    console.error("POST report error:", err);
    const msg = err instanceof Error ? err.message : "Failed to create report";
    return NextResponse.json({ error: msg, success: false }, { status: 500 });
  }
}
