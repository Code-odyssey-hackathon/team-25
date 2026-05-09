import { supabase } from './supabase';

/**
 * K-GRM Escalation Engine
 * 
 * Three-tier, time-bound escalation system:
 *   Level 1: MUNICIPAL    — 4-hour SLA
 *   Level 2: DC           — 10-12 hours additional (after DC alert)
 *   Level 3: MINISTRY     — Final escalation to State Welfare Minister
 * 
 * Escalation Ladder:
 *   PENDING        → (4 hrs)  → ESCALATED_DC
 *   ESCALATED_DC   → (10 hrs) → ESCALATED_MINISTRY
 *   ESCALATED_MINISTRY → Max level reached
 */

export const ESCALATION_LEVELS = {
  MUNICIPAL: {
    label: 'Municipal Corporation',
    icon: '🏙️',
    color: '#10b981',
    slaHours: 4,
    next: 'DC',
  },
  DC: {
    label: 'DC (Deputy Commissioner)',
    icon: '🏢',
    color: '#3b82f6',
    slaHours: 10,  // 10-12 hours additional window
    next: 'MINISTRY',
  },
  MINISTRY: {
    label: 'State Welfare Ministry',
    icon: '🏛️',
    color: '#8b5cf6',
    slaHours: null,  // No further escalation
    next: null,
  },
};

/**
 * Get the current escalation level and time info for a report
 * @param {Object} report - Report object from Supabase
 * @returns {{ level: string, levelInfo: Object, hoursElapsed: number, hoursRemaining: number, isBreached: boolean, nextLevel: string|null }}
 */
export function getEscalationStatus(report) {
  const createdAt = new Date(report.created_at);
  const now = new Date();
  const hoursElapsed = (now - createdAt) / 3600000;

  const currentLevel = report.escalation_level || 'MUNICIPAL';
  const levelInfo = ESCALATION_LEVELS[currentLevel] || ESCALATION_LEVELS.MUNICIPAL;

  let isBreached = false;
  let hoursRemaining = 0;

  if (levelInfo.slaHours) {
    if (currentLevel === 'MUNICIPAL') {
      hoursRemaining = Math.max(0, levelInfo.slaHours - hoursElapsed);
      isBreached = hoursElapsed >= levelInfo.slaHours;
    } else if (currentLevel === 'DC' && report.escalated_to_dc_at) {
      const dcElapsed = (now - new Date(report.escalated_to_dc_at)) / 3600000;
      hoursRemaining = Math.max(0, levelInfo.slaHours - dcElapsed);
      isBreached = dcElapsed >= levelInfo.slaHours;
    }
  }

  return {
    level: currentLevel,
    levelInfo,
    hoursElapsed: Math.round(hoursElapsed * 10) / 10,
    hoursRemaining: Math.round(hoursRemaining * 10) / 10,
    isBreached,
    nextLevel: levelInfo.next,
  };
}

/**
 * Manually escalate a report to the next level
 * Used by DC/Admin to force-escalate
 * @param {string} reportId
 * @returns {{ success: boolean, new_level: string }}
 */
export async function escalateReport(reportId) {
  try {
    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('id, status, escalation_level, created_at, complaint_id, city')
      .eq('id', reportId)
      .single();

    if (fetchError) throw fetchError;

    const currentLevel = report.escalation_level || 'MUNICIPAL';
    const levelInfo = ESCALATION_LEVELS[currentLevel];

    if (!levelInfo?.next) {
      return { success: false, message: 'Max escalation level reached (MINISTRY)' };
    }

    const nextLevel = levelInfo.next;
    const now = new Date().toISOString();

    const updateData = {
      escalation_level: nextLevel,
      auto_escalated_at: now,
    };

    if (nextLevel === 'DC') {
      updateData.escalated_to_dc_at = now;
    } else if (nextLevel === 'MINISTRY') {
      updateData.escalated_to_ministry_at = now;
    }

    const { error: updateError } = await supabase
      .from('reports')
      .update(updateData)
      .eq('id', reportId);

    if (updateError) throw updateError;

    // Create alert for the next level
    await supabase.from('alerts').insert({
      report_id: reportId,
      alert_type: nextLevel === 'MINISTRY' ? 'CRITICAL_ISSUE' : 'AUTO_ESCALATED',
      message: `Complaint ${report.complaint_id || reportId} escalated to ${ESCALATION_LEVELS[nextLevel].label}. Immediate action required.`,
      data: {
        escalation_level: nextLevel,
        previous_level: currentLevel,
        escalated_by: 'MANUAL',
      },
    }).catch(console.error);

    // Fire notification (fire-and-forget)
    fetch((process.env.NEXT_PUBLIC_APP_URL || '') + '/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticket_id: report.complaint_id || reportId,
        new_level: nextLevel,
        department: report.city,
        type: `${nextLevel}_ESCALATION`,
      }),
    }).catch(console.error);

    return { success: true, new_level: nextLevel };
  } catch (err) {
    console.error('Escalation failed:', err);
    throw err;
  }
}

/**
 * Legacy compatibility — escalate a master ticket
 * Kept for backward compatibility with existing master_tickets feature
 */
export async function escalateTicket(masterTicketId) {
  try {
    const { data: ticket, error: fetchError } = await supabase
      .from('master_tickets')
      .select('status, assigned_department')
      .eq('id', masterTicketId)
      .single();

    if (fetchError) throw fetchError;

    const escalationLadder = {
      'PENDING_REVIEW': 'ESCALATED_L1',
      'ESCALATED_L1': 'ESCALATED_L2',
      'ESCALATED_L2': 'ESCALATED_L3',
      'ESCALATED_L3': 'ESCALATED_L4',
    };

    const nextStatus = escalationLadder[ticket.status] || ticket.status;

    if (nextStatus === ticket.status) {
      return { success: false, message: 'Max escalation reached' };
    }

    const { error: updateError } = await supabase
      .from('master_tickets')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', masterTicketId);

    if (updateError) throw updateError;

    fetch((process.env.NEXT_PUBLIC_APP_URL || '') + '/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticket_id: masterTicketId,
        new_level: nextStatus,
        department: ticket.assigned_department,
      }),
    }).catch(console.error);

    return { success: true, new_status: nextStatus };
  } catch (err) {
    console.error('Escalation failed:', err);
    throw err;
  }
}
