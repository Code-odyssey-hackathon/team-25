/**
 * K-GRM — Complaint ID Generator
 * 
 * Generates unique complaint IDs in the format: KA-{DISTRICT_CODE}-{YEAR}-{SEQUENCE}
 * Example: KA-BLG-2026-00423
 */

/**
 * Generate a K-GRM formatted complaint ID
 * @param {string} districtCode - 3-letter district code (e.g., 'BLG' for Belagavi)
 * @param {number} [sequence] - Optional sequence number. If not provided, uses timestamp-based.
 * @returns {string} Formatted complaint ID
 */
export function generateComplaintId(districtCode, sequence) {
  const year = new Date().getFullYear();
  const code = (districtCode || 'GEN').toUpperCase().slice(0, 3);
  
  // If no sequence provided, generate one from timestamp + random
  const seq = sequence || Math.floor(Date.now() % 100000);
  const paddedSeq = String(seq).padStart(5, '0');

  return `KA-${code}-${year}-${paddedSeq}`;
}

/**
 * Parse a K-GRM complaint ID into components
 * @param {string} complaintId - e.g., 'KA-BLG-2026-00423'
 * @returns {{ state: string, district: string, year: number, sequence: number } | null}
 */
export function parseComplaintId(complaintId) {
  const match = complaintId?.match(/^KA-([A-Z]{2,4})-(\d{4})-(\d{5})$/);
  if (!match) return null;

  return {
    state: 'KA',
    district: match[1],
    year: parseInt(match[2], 10),
    sequence: parseInt(match[3], 10),
  };
}
