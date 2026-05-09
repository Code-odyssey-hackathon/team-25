import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * K-GRM Auto-Escalation Check API
 * 
 * This endpoint checks all pending/under-review reports and auto-escalates
 * those that have breached their SLA deadlines.
 * 
 * Escalation Flow:
 *   T+0:00  → Complaint Registered (MUNICIPAL level)
 *   T+4:00  → If unresolved → AUTO-ESCALATE to DC level
 *   T+14:00 → If still unresolved → AUTO-ESCALATE to MINISTRY level
 * 
 * Trigger: Can be called via cron job (Vercel Cron) or manual button.
 * 
 * Method: POST (with optional ?dry_run=true for testing)
 */

const SLA_HOURS_MUNICIPAL = 4;    // 4 hours before DC alert
const SLA_HOURS_DC = 14;          // 14 hours total before Ministry alert

export async function POST(request) {
  try {
    const url = new URL(request.url);
    const dryRun = url.searchParams.get('dry_run') === 'true';

    // Use service role key to bypass RLS for administrative operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const now = new Date();
    const dcCutoff = new Date(now.getTime() - SLA_HOURS_MUNICIPAL * 60 * 60 * 1000);
    const ministryCutoff = new Date(now.getTime() - SLA_HOURS_DC * 60 * 60 * 1000);

    // ─── Level 1 → Level 2 (Municipal → DC) ──────────────────
    // Find reports that are PENDING and older than 4 hours
    const { data: dcEscalations, error: dcError } = await supabase
      .from('reports')
      .select('id, location_name, issue_type, severity, city, state, created_at, complaint_id, priority')
      .in('status', ['PENDING', 'UNDER_REVIEW'])
      .is('escalation_level', null)  // Not yet escalated
      .lt('created_at', dcCutoff.toISOString())
      .order('created_at', { ascending: true });

    if (dcError) {
      console.warn('DC escalation query error (column may not exist yet):', dcError.message);
    }

    // ─── Level 2 → Level 3 (DC → Ministry) ───────────────────
    // Find reports escalated to DC but still unresolved after 14 hours total
    const { data: ministryEscalations, error: minError } = await supabase
      .from('reports')
      .select('id, location_name, issue_type, severity, city, state, created_at, complaint_id, priority, escalated_to_dc_at')
      .in('status', ['PENDING', 'UNDER_REVIEW'])
      .eq('escalation_level', 'DC')
      .lt('created_at', ministryCutoff.toISOString())
      .order('created_at', { ascending: true });

    if (minError) {
      console.warn('Ministry escalation query error (column may not exist yet):', minError.message);
    }

    const results = {
      dc_escalations: [],
      ministry_escalations: [],
      dry_run: dryRun,
      checked_at: now.toISOString(),
    };

    // ─── Process DC Escalations ───────────────────────────────
    if (dcEscalations && dcEscalations.length > 0) {
      for (const report of dcEscalations) {
        if (!dryRun) {
          const { error: updateError } = await supabase
            .from('reports')
            .update({
              escalation_level: 'DC',
              escalated_to_dc_at: now.toISOString(),
              auto_escalated_at: now.toISOString(),
            })
            .eq('id', report.id);

          if (updateError) {
            console.error(`Failed to escalate ${report.id} to DC:`, updateError.message);
            continue;
          }

          // Create alert for DC
          await supabase.from('alerts').insert({
            report_id: report.id,
            alert_type: 'AUTO_ESCALATED',
            message: `Complaint ${report.complaint_id || report.id} has been auto-escalated to DC level. ${report.issue_type?.replace(/_/g, ' ')} at ${report.location_name || report.city} unresolved for ${SLA_HOURS_MUNICIPAL}+ hours.`,
            data: {
              escalation_level: 'DC',
              hours_elapsed: Math.round((now - new Date(report.created_at)) / 3600000 * 10) / 10,
              priority: report.priority || 'HIGH',
            },
          }).catch(console.error);

          // Fire notification (fire-and-forget)
          fetch(new URL('/api/notify', request.url).toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ticket_id: report.complaint_id || report.id,
              new_level: 'DC',
              department: report.city,
              type: 'DC_ESCALATION',
            }),
          }).catch(console.error);
        }

        results.dc_escalations.push({
          id: report.id,
          complaint_id: report.complaint_id,
          location: report.location_name,
          city: report.city,
          issue_type: report.issue_type,
          hours_pending: Math.round((now - new Date(report.created_at)) / 3600000 * 10) / 10,
        });
      }
    }

    // ─── Process Ministry Escalations ─────────────────────────
    if (ministryEscalations && ministryEscalations.length > 0) {
      for (const report of ministryEscalations) {
        if (!dryRun) {
          const { error: updateError } = await supabase
            .from('reports')
            .update({
              escalation_level: 'MINISTRY',
              escalated_to_ministry_at: now.toISOString(),
            })
            .eq('id', report.id);

          if (updateError) {
            console.error(`Failed to escalate ${report.id} to Ministry:`, updateError.message);
            continue;
          }

          // Create critical alert
          await supabase.from('alerts').insert({
            report_id: report.id,
            alert_type: 'CRITICAL_ISSUE',
            message: `CRITICAL — Complaint ${report.complaint_id || report.id} requires Ministry intervention. Unresolved for ${SLA_HOURS_DC}+ hours after DC escalation.`,
            data: {
              escalation_level: 'MINISTRY',
              hours_elapsed: Math.round((now - new Date(report.created_at)) / 3600000 * 10) / 10,
              priority: report.priority || 'CRITICAL',
            },
          }).catch(console.error);

          // Fire SMS + email notification
          fetch(new URL('/api/notify', request.url).toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ticket_id: report.complaint_id || report.id,
              new_level: 'MINISTRY',
              department: report.city,
              type: 'MINISTRY_ESCALATION',
            }),
          }).catch(console.error);
        }

        results.ministry_escalations.push({
          id: report.id,
          complaint_id: report.complaint_id,
          location: report.location_name,
          city: report.city,
          issue_type: report.issue_type,
          hours_pending: Math.round((now - new Date(report.created_at)) / 3600000 * 10) / 10,
        });
      }
    }

    console.log(`[K-GRM Escalation] DC: ${results.dc_escalations.length}, Ministry: ${results.ministry_escalations.length}${dryRun ? ' (DRY RUN)' : ''}`);

    return NextResponse.json({
      success: true,
      ...results,
      summary: {
        dc_count: results.dc_escalations.length,
        ministry_count: results.ministry_escalations.length,
      },
    });

  } catch (error) {
    console.error('Escalation check error:', error);
    return NextResponse.json({ error: 'Escalation check failed', details: error.message }, { status: 500 });
  }
}

/**
 * GET — Returns escalation status summary
 */
export async function GET() {
  return NextResponse.json({
    service: 'K-GRM Auto-Escalation',
    sla_config: {
      municipal_deadline_hours: SLA_HOURS_MUNICIPAL,
      dc_deadline_hours: SLA_HOURS_DC,
    },
    endpoints: {
      trigger: 'POST /api/escalation-check',
      dry_run: 'POST /api/escalation-check?dry_run=true',
    },
  });
}
