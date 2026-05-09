/**
 * JanaVaani + JanaSetu Feature Flags
 * 
 * Centralized configuration for enabling/disabling new PRD features
 * without breaking the existing application.
 */

export const FLAGS = {
  // Phase 1: Citizen AI Reporting
  ENABLE_VOICE_REPORT: process.env.NEXT_PUBLIC_ENABLE_VOICE_REPORT === 'true',
  ENABLE_AI_PHOTO_PARSE: process.env.NEXT_PUBLIC_ENABLE_AI_PHOTO_PARSE === 'true',
  ENABLE_ME_TOO_UPVOTE: process.env.NEXT_PUBLIC_ENABLE_ME_TOO_UPVOTE === 'true',

  // Phase 2: Public Visualisation
  ENABLE_CITY_PULSE: process.env.NEXT_PUBLIC_ENABLE_CITY_PULSE === 'true',
  ENABLE_PREDICTIVE_INFRA: process.env.NEXT_PUBLIC_ENABLE_PREDICTIVE_INFRA === 'true',

  // Phase 3 & 4: Backend Intelligence & Escalation
  ENABLE_MASTER_TICKETS: process.env.NEXT_PUBLIC_ENABLE_MASTER_TICKETS === 'true',
  ENABLE_AUTO_ESCALATION: process.env.NEXT_PUBLIC_ENABLE_AUTO_ESCALATION === 'true',

  // Phase 5 & 6: Trust, Blockchain, Gamification
  ENABLE_CIVIC_TRUST: process.env.NEXT_PUBLIC_ENABLE_CIVIC_TRUST === 'true',
  ENABLE_BLOCKCHAIN: process.env.NEXT_PUBLIC_ENABLE_BLOCKCHAIN === 'true',
  ENABLE_CIVIC_REWARDS: process.env.NEXT_PUBLIC_ENABLE_CIVIC_REWARDS === 'true',
  
  // Phase 6 & 7: Chat, SOS, and Future
  ENABLE_AI_CHAT: process.env.NEXT_PUBLIC_ENABLE_AI_CHAT === 'true',
  ENABLE_SOS: process.env.NEXT_PUBLIC_ENABLE_SOS === 'true',
  ENABLE_PREDICTIVE_MAINTENANCE: process.env.NEXT_PUBLIC_ENABLE_PREDICTIVE_MAINTENANCE === 'true',
  ENABLE_DIRECT_CHAT: process.env.NEXT_PUBLIC_ENABLE_DIRECT_CHAT === 'true',
};

/**
 * Helper to check if a feature is enabled.
 * Can be extended later to support user-based rollout (e.g. LaunchDarkly).
 */
export function isFeatureEnabled(featureName) {
  return !!FLAGS[featureName];
}
