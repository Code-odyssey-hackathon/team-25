import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendTaskSms } from "@/lib/twilio";

// GET /api/reports/[id]
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("reports").select("*, profiles!reports_user_id_fkey(full_name, avatar_url)").eq("id", id).single();
    if (error) throw error;
    return NextResponse.json({ data, success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Report not found";
    return NextResponse.json({ error: msg, success: false }, { status: 404 });
  }
}

// PATCH /api/reports/[id] — Update report status, proof, etc.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
    }

    // Fetch current user role
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    const isAdmin = profile?.role === "admin";
    const isWorker = profile?.role === "worker";

    const body = await request.json();
    const allowedFields = ["status", "proof_url", "title", "description", "category", "ward", "assigned_to"];
    const updates: Record<string, unknown> = {};

    for (const key of allowedFields) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update", success: false }, { status: 400 });
    }

    // Permission checks
    if (updates.assigned_to && !isAdmin) {
      return NextResponse.json({ error: "Only admins can assign tasks", success: false }, { status: 403 });
    }

    // If resolving, require proof_url
    if (updates.status === "resolved" && !body.proof_url) {
      const { data: existing } = await supabase.from("reports").select("proof_url, assigned_to").eq("id", id).single();
      
      // Ensure only the assigned worker or admin can resolve
      if (!isAdmin && existing?.assigned_to !== user.id) {
        return NextResponse.json({ error: "Only the assigned worker can resolve this task", success: false }, { status: 403 });
      }

      if (!existing?.proof_url) {
        return NextResponse.json({ error: "Proof of completion photo is required to resolve", success: false }, { status: 400 });
      }
    }

    // Handle Assignment logic (Twilio SMS + Assignment record)
    let smsResult = null;
    if (updates.assigned_to) {
      const workerId = updates.assigned_to as string;
      
      // Fetch worker details and report title
      const [{ data: worker }, { data: report }] = await Promise.all([
        supabase.from("profiles").select("phone, full_name").eq("id", workerId).single(),
        supabase.from("reports").select("title").eq("id", id).single(),
      ]);

      if (worker?.phone && report?.title) {
        smsResult = await sendTaskSms(worker.phone, report.title, id);
      }

      // Record assignment
      await supabase.from("assignments").insert({
        report_id: id,
        worker_id: workerId,
        assigned_by: user.id,
        notes: body.notes || "Assigned via dashboard",
        sms_sent: !!smsResult?.success,
        sms_sid: smsResult?.sid || null,
      });

      // Update report status to acknowledged if it was just submitted
      const { data: currentReport } = await supabase.from("reports").select("status").eq("id", id).single();
      if (currentReport?.status === "submitted") {
        updates.status = "acknowledged";
      }
    }

    const { data, error } = await supabase.from("reports").update(updates).eq("id", id).select().single();
    if (error) throw error;

    return NextResponse.json({ data, sms: smsResult, success: true });
  } catch (err) {
    console.error("PATCH report error:", err);
    const msg = err instanceof Error ? err.message : "Failed to update report";
    return NextResponse.json({ error: msg, success: false }, { status: 500 });
  }
}
