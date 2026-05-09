/**
 * K-GRM — Priority Classification System
 * 
 * Maps issue categories to priority levels with SLA deadlines
 * and scoring multipliers as per K-GRM specification.
 * 
 * Priority Levels:
 *   CRITICAL — Life Safety         (SLA: 1 Hour)
 *   HIGH     — Public Health       (SLA: 4 Hours)
 *   MEDIUM   — Civic Infrastructure (SLA: 24 Hours)
 *   LOW      — Routine Services     (SLA: 72 Hours)
 */

export const PRIORITY_LEVELS = {
  CRITICAL: { label: 'CRITICAL', color: '#dc2626', bgColor: 'rgba(220,38,38,0.15)', slaHours: 1, scoreMultiplier: 3.0, icon: '🔴' },
  HIGH:     { label: 'HIGH',     color: '#ef4444', bgColor: 'rgba(239,68,68,0.15)', slaHours: 4, scoreMultiplier: 2.0, icon: '🟠' },
  MEDIUM:   { label: 'MEDIUM',   color: '#f59e0b', bgColor: 'rgba(245,158,11,0.15)', slaHours: 24, scoreMultiplier: 1.5, icon: '🟡' },
  LOW:      { label: 'LOW',      color: '#94a3b8', bgColor: 'rgba(148,163,184,0.15)', slaHours: 72, scoreMultiplier: 1.0, icon: '🟢' },
};

/**
 * Full K-GRM Priority Map — Issue sub-categories → priority + SLA
 */
export const PRIORITY_MAP = {
  // CRITICAL — Life Safety (SLA: 1 Hour)
  'Exposed Live Electrical Wire':     { priority: 'CRITICAL', slaHours: 1,  scoreMultiplier: 3.0 },
  'Major Road Cave-In':               { priority: 'CRITICAL', slaHours: 1,  scoreMultiplier: 3.0 },
  'Sewage Overflow on Road':          { priority: 'CRITICAL', slaHours: 1,  scoreMultiplier: 3.0 },
  'Collapsed Structure':              { priority: 'CRITICAL', slaHours: 1,  scoreMultiplier: 3.0 },
  'Water Supply Contamination':       { priority: 'CRITICAL', slaHours: 1,  scoreMultiplier: 3.0 },

  // HIGH — Public Health & Safety (SLA: 4 Hours)
  'Pothole (Major)':                  { priority: 'HIGH', slaHours: 4,  scoreMultiplier: 2.0 },
  'Garbage Pile (>48hrs)':            { priority: 'HIGH', slaHours: 4,  scoreMultiplier: 2.0 },
  'Streetlight Failure (Busy Road)':  { priority: 'HIGH', slaHours: 4,  scoreMultiplier: 2.0 },
  'Open Manhole':                     { priority: 'HIGH', slaHours: 4,  scoreMultiplier: 2.0 },
  'Stray Animal Menace':              { priority: 'HIGH', slaHours: 4,  scoreMultiplier: 2.0 },

  // MEDIUM — Civic Infrastructure (SLA: 24 Hours)
  'Pothole (Minor)':                  { priority: 'MEDIUM', slaHours: 24, scoreMultiplier: 1.5 },
  'Broken Footpath':                  { priority: 'MEDIUM', slaHours: 24, scoreMultiplier: 1.5 },
  'Drainage Blockage':                { priority: 'MEDIUM', slaHours: 24, scoreMultiplier: 1.5 },
  'Park Maintenance':                 { priority: 'MEDIUM', slaHours: 24, scoreMultiplier: 1.5 },

  // LOW — Routine Services (SLA: 72 Hours)
  'Tree Trimming':                    { priority: 'LOW', slaHours: 72, scoreMultiplier: 1.0 },
  'Sign Board Damaged':               { priority: 'LOW', slaHours: 72, scoreMultiplier: 1.0 },
  'Illegal Hoarding':                 { priority: 'LOW', slaHours: 72, scoreMultiplier: 1.0 },
  'Noise Complaint':                  { priority: 'LOW', slaHours: 72, scoreMultiplier: 1.0 },
};

/**
 * Map existing JanaVaani issue types to K-GRM priorities
 * This bridges the current system with K-GRM classification
 */
export const ISSUE_TYPE_TO_PRIORITY = {
  'POTHOLE':            'HIGH',
  'ROAD_CRACK':         'MEDIUM',
  'WATER_LEAK':         'HIGH',
  'STREETLIGHT_OUT':    'HIGH',
  'GARBAGE_DUMP':       'HIGH',
  'STRUCTURAL_DAMAGE':  'CRITICAL',
  'DRAINAGE_ISSUE':     'MEDIUM',
  'OTHER':              'MEDIUM',
};

/**
 * Map existing JanaVaani severity to K-GRM escalation urgency
 */
export const SEVERITY_TO_PRIORITY_BOOST = {
  'DANGEROUS': 1,  // Boost priority one level up (e.g., HIGH → CRITICAL)
  'SERIOUS':   0,  // Keep as-is
  'VISIBLE':   0,  // Keep as-is
};

const PRIORITY_ORDER = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

/**
 * Auto-assign K-GRM priority based on issue type + severity
 * @param {string} issueType - JanaVaani issue type enum
 * @param {string} severity - JanaVaani severity enum
 * @returns {{ priority: string, slaHours: number, scoreMultiplier: number }}
 */
export function assignPriority(issueType, severity) {
  let basePriority = ISSUE_TYPE_TO_PRIORITY[issueType] || 'MEDIUM';
  const boost = SEVERITY_TO_PRIORITY_BOOST[severity] || 0;

  if (boost > 0) {
    const currentIdx = PRIORITY_ORDER.indexOf(basePriority);
    const boostedIdx = Math.min(currentIdx + boost, PRIORITY_ORDER.length - 1);
    basePriority = PRIORITY_ORDER[boostedIdx];
  }

  const level = PRIORITY_LEVELS[basePriority];
  return {
    priority: basePriority,
    slaHours: level.slaHours,
    scoreMultiplier: level.scoreMultiplier,
  };
}

/**
 * Compute SLA deadline timestamp from creation time + priority
 * @param {string|Date} createdAt - Report creation timestamp
 * @param {string} priority - K-GRM priority level
 * @returns {Date} SLA deadline
 */
export function computeSLADeadline(createdAt, priority) {
  const created = new Date(createdAt);
  const level = PRIORITY_LEVELS[priority] || PRIORITY_LEVELS.MEDIUM;
  return new Date(created.getTime() + level.slaHours * 60 * 60 * 1000);
}

/**
 * Check if a report has breached its SLA deadline
 * @param {string|Date} createdAt
 * @param {string} priority
 * @returns {{ breached: boolean, minutesOverdue: number, hoursOverdue: number }}
 */
export function checkSLABreach(createdAt, priority) {
  const deadline = computeSLADeadline(createdAt, priority);
  const now = new Date();
  const diffMs = now.getTime() - deadline.getTime();
  const breached = diffMs > 0;

  return {
    breached,
    minutesOverdue: breached ? Math.floor(diffMs / 60000) : 0,
    hoursOverdue: breached ? Math.round(diffMs / 3600000 * 10) / 10 : 0,
    deadline,
  };
}

/**
 * Get human-readable time remaining until SLA breach
 * @param {string|Date} createdAt
 * @param {string} priority
 * @returns {string}
 */
export function getSLATimeRemaining(createdAt, priority) {
  const deadline = computeSLADeadline(createdAt, priority);
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();

  if (diffMs <= 0) {
    const overdue = Math.abs(diffMs);
    const hrs = Math.floor(overdue / 3600000);
    const mins = Math.floor((overdue % 3600000) / 60000);
    return `⚠️ OVERDUE by ${hrs}h ${mins}m`;
  }

  const hrs = Math.floor(diffMs / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);
  if (hrs === 0) return `${mins}m remaining`;
  return `${hrs}h ${mins}m remaining`;
}
