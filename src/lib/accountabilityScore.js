/**
 * K-GRM — District Scoring System ("Response Matrix")
 * 
 * Formula per K-GRM specification:
 * DISTRICT_SCORE = (Resolution_Rate × 40)
 *                + (Speed_Bonus × 30)
 *                + (Avg_Quality × 20)
 *                − (Rejection_Rate × 10)
 *                − (DC_Escalations × 5)
 *                − (Ministry_Escalations × 20)
 * 
 * Also retains the legacy computeAccountabilityScore for backward compatibility.
 */

/**
 * Legacy — Compute accountability score for an authority (0–100).
 * Higher = more accountable (responds faster, takes more actions).
 * Kept for backward compatibility with existing Leaderboard.
 */
export function computeAccountabilityScore(authority) {
  const total = (authority.total_actioned || 0) + (authority.total_ignored || 0);
  if (total === 0) return null;

  const responseRate = (authority.total_actioned || 0) / total;
  const responseRateScore = responseRate * 60;

  const efficiencyBonus = (authority.total_actioned || 0) > (authority.total_ignored || 0) ? 40 :
                          (authority.total_actioned || 0) === (authority.total_ignored || 0) ? 20 : 0;

  return Math.round(Math.min(100, responseRateScore + efficiencyBonus));
}

/**
 * Legacy — Get accountability label
 */
export function getAccountabilityLabel(score) {
  if (score === null) return { label: 'No Data', color: '#94a3b8' };
  if (score >= 75) return { label: 'Accountable', color: '#10b981' };
  if (score >= 50) return { label: 'Partial', color: '#f59e0b' };
  if (score >= 25) return { label: 'Poor', color: '#f97316' };
  return { label: 'Negligent', color: '#ef4444' };
}

// ─── K-GRM District Scoring ────────────────────────────────

/**
 * Compute K-GRM district score using the official formula
 * @param {Object} stats - District statistics
 * @param {number} stats.totalComplaints - Total complaints received
 * @param {number} stats.resolvedComplaints - Complaints resolved
 * @param {number} stats.resolvedWithinSLA - Complaints resolved within SLA deadline
 * @param {number} stats.avgCitizenRating - Average citizen satisfaction (1-5)
 * @param {number} stats.rejectedComplaints - Complaints rejected without reason
 * @param {number} stats.dcEscalations - Complaints reaching DC level
 * @param {number} stats.ministryEscalations - Complaints reaching Ministry level
 * @returns {{ score: number, breakdown: Object }}
 */
export function computeDistrictScore(stats) {
  const { 
    totalComplaints = 0, 
    resolvedComplaints = 0,
    resolvedWithinSLA = 0,
    avgCitizenRating = 3,
    rejectedComplaints = 0,
    dcEscalations = 0,
    ministryEscalations = 0,
  } = stats;

  if (totalComplaints === 0) {
    return { score: null, breakdown: null };
  }

  // Component 1: Resolution Rate (up to 40 pts)
  const resolutionRate = resolvedComplaints / totalComplaints;
  const resolutionScore = resolutionRate * 40;

  // Component 2: Speed Bonus (up to 30 pts)
  // Based on % resolved within SLA deadline
  const slaRate = totalComplaints > 0 ? resolvedWithinSLA / totalComplaints : 0;
  const speedScore = slaRate * 30;

  // Component 3: Quality Score (up to 20 pts)
  // Average citizen rating normalized to 0-20
  const qualityScore = (avgCitizenRating / 5) * 20;

  // Penalty: Rejection Rate (-10 pts each batch)
  const rejectionRate = totalComplaints > 0 ? rejectedComplaints / totalComplaints : 0;
  const rejectionPenalty = rejectionRate * 10;

  // Penalty: DC Escalations (-5 pts each)
  const dcPenalty = dcEscalations * 5;

  // Penalty: Ministry Escalations (-20 pts each)
  const ministryPenalty = ministryEscalations * 20;

  const rawScore = resolutionScore + speedScore + qualityScore - rejectionPenalty - dcPenalty - ministryPenalty;
  const score = Math.round(Math.max(0, Math.min(100, rawScore)));

  return {
    score,
    breakdown: {
      resolutionScore: Math.round(resolutionScore * 10) / 10,
      speedScore: Math.round(speedScore * 10) / 10,
      qualityScore: Math.round(qualityScore * 10) / 10,
      rejectionPenalty: Math.round(rejectionPenalty * 10) / 10,
      dcPenalty,
      ministryPenalty,
      resolutionRate: Math.round(resolutionRate * 100),
      slaRate: Math.round(slaRate * 100),
    },
  };
}

/**
 * Get district performance label based on K-GRM score
 * @param {number} score - 0 to 100
 * @returns {{ label: string, badge: string, stars: number, color: string, action: string }}
 */
export function getDistrictLabel(score) {
  if (score === null) return { label: 'No Data', badge: '—', stars: 0, color: '#94a3b8', action: 'none' };
  if (score >= 90) return { label: 'Excellence Award', badge: '★★★★★', stars: 5, color: '#fbbf24', action: 'recognition' };
  if (score >= 80) return { label: 'Star Performer', badge: '★★★★★', stars: 5, color: '#10b981', action: 'recognition' };
  if (score >= 70) return { label: 'Commendable', badge: '★★★★', stars: 4, color: '#34d399', action: 'recognition' };
  if (score >= 60) return { label: 'Good', badge: '★★★★', stars: 4, color: '#60a5fa', action: 'none' };
  if (score >= 50) return { label: 'Average', badge: '★★★', stars: 3, color: '#f59e0b', action: 'none' };
  if (score >= 35) return { label: 'Needs Improvement', badge: '★★', stars: 2, color: '#f97316', action: 'warning' };
  if (score >= 20) return { label: 'Improvement Needed', badge: '★', stars: 1, color: '#ef4444', action: 'warning' };
  return { label: 'Notice Issued', badge: '✗', stars: 0, color: '#dc2626', action: 'notice' };
}

/**
 * Get average resolution time in hours from a set of reports
 * @param {Array} reports - Array of report objects
 * @returns {number} Average hours
 */
export function getAvgResolutionHours(reports) {
  const resolved = reports.filter(r => r.status === 'ACTION_TAKEN' && r.responded_at);
  if (resolved.length === 0) return 0;

  const totalHours = resolved.reduce((sum, r) => {
    const filed = new Date(r.created_at);
    const responded = new Date(r.responded_at);
    return sum + Math.max(0, (responded - filed) / 3600000);
  }, 0);

  return Math.round(totalHours / resolved.length * 10) / 10;
}
