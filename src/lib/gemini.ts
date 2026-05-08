// =============================================================================
// JanaVaani — Gemini AI SDK Initialization
// Targets Gemini 1.5 Flash exclusively as per PRD
// =============================================================================

import { GoogleGenerativeAI } from "@google/generative-ai";

function getGenAI() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Missing env: GEMINI_API_KEY");
  return new GoogleGenerativeAI(key);
}

// Primary model for image classification and text generation
export function getGeminiFlash() {
  return getGenAI().getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      temperature: 0.3,
      topP: 0.8,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
    },
  });
}

/**
 * Generate a text embedding for semantic search and clustering.
 * Uses text-embedding-004 (768 dimensions).
 */
export async function getTextEmbedding(text: string) {
  const model = getGenAI().getGenerativeModel({
    model: "text-embedding-004",
  });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

// Higher creativity model instance for summary generation
export function getGeminiFlashCreative() {
  return getGenAI().getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
    },
  });
}

// ---------------------------------------------------------------------------
// Prompt Templates
// ---------------------------------------------------------------------------

export const PROMPTS = {
  CLASSIFY_IMAGE: `You are an AI assistant for a civic issue reporting platform in India called JanaVaani.

Analyze the provided image of a civic/infrastructure issue and return a JSON object with:
- "category": one of ["pothole", "garbage", "water_leak", "streetlight", "road_damage", "drainage", "encroachment", "other"]
- "confidence": a float between 0 and 1 indicating your confidence
- "severity": an integer from 1 (minor) to 10 (critical emergency) based on visual severity, size, and potential danger to public
- "summary": a concise 1-2 sentence description of the issue suitable for a government report
- "suggested_title": a short, descriptive title (max 60 chars) for the report

Be conservative with severity scores. Only rate 8-10 for genuinely dangerous situations (large sinkholes, sewage overflow, collapsed infrastructure). Rate 1-3 for minor aesthetic issues.

Return ONLY the JSON object, no markdown formatting.`,

  AUDIT_REPORT: `You are a plausibility auditor for a civic grievance platform. 
You are given a report's details and must determine if it's plausible and not spam/fake.

Analyze the following report and return a JSON object with:
- "is_plausible": boolean - true if the report seems genuine
- "reasoning": string - brief explanation of your assessment
- "adjusted_severity": number or null - if severity seems miscalibrated, suggest a correction (1-10), otherwise null

Consider: Does the category match the description? Is the severity reasonable? Does the location make sense for this type of issue?

Return ONLY the JSON object, no markdown formatting.`,
} as const;



