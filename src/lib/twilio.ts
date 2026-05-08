// =============================================================================
// JanaVaani — Twilio SMS Service
// Used to dispatch SMS alerts to field workers
// =============================================================================

import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

/**
 * Dynamically determines the base URL for the application.
 * Priority: 
 * 1. VERCEL_URL (Automatically set by Vercel)
 * 2. NEXT_PUBLIC_APP_URL (Set manually in .env)
 * 3. Localhost (Default fallback)
 */
function getBaseUrl() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export async function sendTaskSms(to: string, taskTitle: string, reportId: string) {
  if (!client || !fromNumber) {
    console.warn("Twilio not configured. Skipping SMS dispatch.");
    return { success: false, error: "Twilio not configured" };
  }

  try {
    const baseUrl = getBaseUrl();
    const taskUrl = `${baseUrl}/worker?id=${reportId}`;

    const message = await client.messages.create({
      body: `📢 JanaVaani Task: A new ${taskTitle} has been assigned to you. View details: ${taskUrl}`,
      from: fromNumber,
      to,
    });

    return { success: true, sid: message.sid };
  } catch (error) {
    console.error("Twilio SMS error:", error);
    return { success: false, error: error instanceof Error ? error.message : "SMS failed" };
  }
}
