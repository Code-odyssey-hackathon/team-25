/**
 * K-GRM — Citizen Score System ("Civic Hero")
 * 
 * Points system for citizen engagement as specified in K-GRM:
 *   +10  New Report Submitted (geotagged, unique, verified)
 *   +5   Complaint Validated (confirming another citizen's issue)
 *   +5   Resolution Feedback (rating quality of fix)
 *   ×1.5 to ×2.0 High Urgency Report multiplier
 *   -15  False Report Penalty
 */

const CITIZEN_POINTS = {
  REPORT_SUBMITTED: 10,
  HIGH_URGENCY_MULTIPLIER: 1.5,
  CRITICAL_URGENCY_MULTIPLIER: 2.0,
  COMPLAINT_VALIDATED: 5,
  RESOLUTION_FEEDBACK: 5,
  FALSE_REPORT_PENALTY: -15,
};

/**
 * Calculate points for a new report submission
 * @param {{ priority: string }} report
 * @returns {number}
 */
export function getReportPoints(report) {
  let points = CITIZEN_POINTS.REPORT_SUBMITTED;

  if (report.priority === 'CRITICAL') {
    points *= CITIZEN_POINTS.CRITICAL_URGENCY_MULTIPLIER;
  } else if (report.priority === 'HIGH') {
    points *= CITIZEN_POINTS.HIGH_URGENCY_MULTIPLIER;
  }

  return Math.round(points);
}

/**
 * Calculate total citizen score from activity history
 * @param {{ reports: number, validations: number, feedbacks: number, falseReports: number, criticalReports: number, highReports: number }} activity
 * @returns {number}
 */
export function computeCitizenScore(activity) {
  const normalReports = (activity.reports || 0) - (activity.criticalReports || 0) - (activity.highReports || 0);
  
  let score = 0;
  score += normalReports * CITIZEN_POINTS.REPORT_SUBMITTED;
  score += (activity.criticalReports || 0) * CITIZEN_POINTS.REPORT_SUBMITTED * CITIZEN_POINTS.CRITICAL_URGENCY_MULTIPLIER;
  score += (activity.highReports || 0) * CITIZEN_POINTS.REPORT_SUBMITTED * CITIZEN_POINTS.HIGH_URGENCY_MULTIPLIER;
  score += (activity.validations || 0) * CITIZEN_POINTS.COMPLAINT_VALIDATED;
  score += (activity.feedbacks || 0) * CITIZEN_POINTS.RESOLUTION_FEEDBACK;
  score += (activity.falseReports || 0) * CITIZEN_POINTS.FALSE_REPORT_PENALTY;

  return Math.max(0, Math.round(score));
}

/**
 * Get citizen rank label based on score
 * @param {number} score
 * @returns {{ label: string, emoji: string, color: string, tier: string }}
 */
export function getCitizenRank(score) {
  if (score >= 500) return { label: 'Civic Champion', emoji: '🏆', color: '#fbbf24', tier: 'CHAMPION' };
  if (score >= 250) return { label: 'Civic Hero', emoji: '🦸', color: '#a78bfa', tier: 'HERO' };
  if (score >= 100) return { label: 'Active Citizen', emoji: '⭐', color: '#60a5fa', tier: 'ACTIVE' };
  if (score >= 25)  return { label: 'Engaged Citizen', emoji: '👤', color: '#34d399', tier: 'ENGAGED' };
  return { label: 'New Citizen', emoji: '🌱', color: '#94a3b8', tier: 'NEW' };
}

/**
 * Get rewards available at the citizen's current tier
 * @param {string} tier
 * @returns {string[]}
 */
export function getAvailableRewards(tier) {
  const rewards = {
    CHAMPION: [
      '🏆 Featured on City Leaderboard',
      '📜 "Good Citizen" Certificate',
      '🎟️ Discounts on municipal services',
      '⚡ Priority processing for requests',
    ],
    HERO: [
      '📜 "Good Citizen" Certificate',
      '🎟️ Discounts on municipal services',
      '⚡ Priority processing for requests',
    ],
    ACTIVE: [
      '📜 "Good Citizen" Certificate',
      '🎟️ Park/pool access discount',
    ],
    ENGAGED: [
      '📜 Digital appreciation badge',
    ],
    NEW: [],
  };

  return rewards[tier] || [];
}

export { CITIZEN_POINTS };
