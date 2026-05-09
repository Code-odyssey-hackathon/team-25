/**
 * K-GRM — Email Template System
 * 
 * Auto-generated escalation emails for DC and Ministry notifications.
 * Templates follow the K-GRM specification format.
 */

/**
 * Generate DC escalation email (Level 1 → Level 2)
 * Sent when municipal fails to resolve within 4-hour SLA
 */
export function generateDCEscalationEmail(complaint, engineer, district) {
  const deadline = new Date(new Date(complaint.created_at).getTime() + 16 * 60 * 60 * 1000);
  const deadlineStr = deadline.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  return {
    subject: `URGENT — Complaint ${complaint.complaint_id || complaint.id} Unresolved [Action Required]`,
    body: `Dear Municipal Commissioner, ${district?.corporationName || complaint.city + ' City Corporation'},

The following complaint registered by citizen has NOT been resolved within the mandated 4-hour Sakala service window:

  Complaint ID : ${complaint.complaint_id || complaint.id}
  Category     : ${(complaint.issue_type || '').replace(/_/g, ' ')}
  Location     : ${complaint.location_name || 'N/A'}, ${complaint.city || 'N/A'}
  Priority     : ${complaint.priority || 'HIGH'}
  Submitted    : ${new Date(complaint.created_at).toLocaleString('en-IN')}

${engineer ? `Review of engineer action logs indicates: ${engineer.delay_reason || 'No update logged by assigned engineer'}.

Assigned Engineer: ${engineer.name} (ID: ${engineer.employee_id || 'N/A'})
Contact: ${engineer.contact_phone || 'N/A'}` : 'No engineer has been assigned to this complaint.'}

You are hereby directed to:
1. Resolve the complaint by [FINAL DEADLINE: ${deadlineStr}]
2. Submit justification for delay within 1 hour of this notice
3. ${engineer ? `Ensure engineer ${engineer.name} resumes field work immediately` : 'Assign a field engineer immediately'}

Failure to comply will result in escalation to the Office of the State Social Welfare Minister, Dr. H. C. Mahadevappa.

— Deputy Commissioner, ${district?.name || complaint.city} District
   [DC NIC Portal Reference: ${district?.dcPortal || 'karnataka.gov.in'}]`,
    html: generateDCEscalationHTML(complaint, engineer, district, deadlineStr),
  };
}

/**
 * Generate Ministry escalation email (Level 2 → Level 3)
 * Sent when DC deadline also breached (10-12 hours after DC alert)
 */
export function generateMinistryEscalationEmail(complaint, district, districtStats) {
  return {
    subject: `CRITICAL — Complaint ${complaint.complaint_id || complaint.id} Requires Ministry Intervention`,
    body: `Office of Dr. H. C. Mahadevappa, Social Welfare Minister, Karnataka

CRITICAL COMPLAINT — MINISTRY INTERVENTION REQUIRED

  Complaint ID : ${complaint.complaint_id || complaint.id}
  Category     : ${(complaint.issue_type || '').replace(/_/g, ' ')}
  Priority     : ${complaint.priority || 'CRITICAL'}
  Location     : ${complaint.location_name || 'N/A'}, ${complaint.city || 'N/A'}
  District     : ${district?.name || complaint.city}
  Submitted    : ${new Date(complaint.created_at).toLocaleString('en-IN')}
  
ESCALATION HISTORY:
  Municipal SLA Deadline: BREACHED
  DC Intervention Deadline: BREACHED
  Total Time Unresolved: ${getHoursElapsed(complaint.created_at)} hours

${districtStats ? `DISTRICT PERFORMANCE (${district?.name || complaint.city}):
  Total Complaints This Month: ${districtStats.total}
  Resolution Rate: ${districtStats.resolutionRate}%
  Ministry Escalations: ${districtStats.ministryEscalations}` : ''}

This complaint has been flagged as CRITICAL — MINISTRY INTERVENTION on the state dashboard.

— Karnataka Grievance Redressal & Management System (K-GRM)
   Directorate of Municipal Administration
   dma.karnataka.gov.in`,
  };
}

/**
 * Generate performance improvement notice for bottom districts
 */
export function generateDistrictNotice(district, rank, totalDistricts, score, stats) {
  const month = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  
  return {
    subject: `Performance Improvement Notice — GRM Monthly Review, ${month}`,
    body: `From: Office of Dr. H. C. Mahadevappa, Social Welfare Minister, Karnataka
To:   Deputy Commissioner & Municipal Commissioner, ${district.name}

Subject: Performance Improvement Notice — GRM Monthly Review, ${month}

Your district has ranked ${rank}/${totalDistricts} in the Karnataka GRM Leaderboard for ${month} with a score of ${score}/100.

Key areas of concern:
  • Resolution Rate: ${stats.resolutionRate}% (State Avg: ${stats.stateAvgResolution}%)
  • Average Resolution Time: ${stats.avgResolutionHours} hrs (Target: <4 hrs)
  • Ministry Escalations: ${stats.ministryEscalations} complaints

You are directed to submit an Action Plan within 7 days.
A review meeting has been scheduled for ${getReviewDate()}.

— Directorate of Municipal Administration, Karnataka
   dma.karnataka.gov.in`,
  };
}

// ─── Helpers ───────────────────────────────────────────────

function getHoursElapsed(createdAt) {
  const diff = Date.now() - new Date(createdAt).getTime();
  return Math.round(diff / 3600000 * 10) / 10;
}

function getReviewDate() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toLocaleDateString('en-IN', { dateStyle: 'long' });
}

function generateDCEscalationHTML(complaint, engineer, district, deadlineStr) {
  return `
<div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; border-radius: 12px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 24px; text-align: center;">
    <h1 style="margin: 0; font-size: 1.4rem; color: #fff;">⚠️ URGENT — SLA Breach Alert</h1>
    <p style="margin: 8px 0 0; font-size: 0.9rem; color: rgba(255,255,255,0.8);">Karnataka Grievance Redressal System (K-GRM)</p>
  </div>
  <div style="padding: 24px;">
    <div style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; padding: 16px; margin-bottom: 20px;">
      <table style="width: 100%; color: #e2e8f0; font-size: 0.9rem;">
        <tr><td style="padding: 4px 0; color: #94a3b8;">Complaint ID</td><td style="padding: 4px 0; font-weight: 700;">${complaint.complaint_id || complaint.id}</td></tr>
        <tr><td style="padding: 4px 0; color: #94a3b8;">Category</td><td style="padding: 4px 0;">${(complaint.issue_type || '').replace(/_/g, ' ')}</td></tr>
        <tr><td style="padding: 4px 0; color: #94a3b8;">Location</td><td style="padding: 4px 0;">${complaint.location_name || 'N/A'}, ${complaint.city || 'N/A'}</td></tr>
        <tr><td style="padding: 4px 0; color: #94a3b8;">Priority</td><td style="padding: 4px 0;"><span style="background: #ef4444; color: #fff; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem;">${complaint.priority || 'HIGH'}</span></td></tr>
        <tr><td style="padding: 4px 0; color: #94a3b8;">Final Deadline</td><td style="padding: 4px 0; color: #fbbf24; font-weight: 700;">${deadlineStr}</td></tr>
      </table>
    </div>
    ${engineer ? `
    <div style="background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.3); border-radius: 8px; padding: 16px; margin-bottom: 20px;">
      <h3 style="margin: 0 0 8px; font-size: 0.95rem; color: #60a5fa;">👷 Assigned Engineer</h3>
      <p style="margin: 0; color: #e2e8f0;">${engineer.name} (${engineer.employee_id || 'N/A'})</p>
      <p style="margin: 4px 0 0; color: #94a3b8; font-size: 0.85rem;">${engineer.contact_phone || 'No contact'}</p>
    </div>` : ''}
    <p style="color: #94a3b8; font-size: 0.85rem; text-align: center; margin-top: 20px;">
      — Deputy Commissioner, ${district?.name || complaint.city} District
    </p>
  </div>
</div>`;
}
