import { NextRequest, NextResponse } from "next/server";
import { getGeminiFlashCreative, PROMPTS } from "@/lib/gemini";

// POST /api/ai/audit — Plausibility audit of a report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, category, severity, address } = body;

    if (!title || !category) {
      return NextResponse.json({ error: "title and category are required", success: false }, { status: 400 });
    }

    const reportContext = `Report Title: ${title}\nDescription: ${description || "N/A"}\nCategory: ${category}\nSeverity: ${severity || "N/A"}\nLocation: ${address || "N/A"}`;

    const result = await getGeminiFlashCreative().generateContent([
      { text: PROMPTS.AUDIT_REPORT },
      { text: reportContext },
    ]);

    const text = result.response.text();
    let audit;
    try {
      audit = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        audit = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse AI audit response");
      }
    }

    return NextResponse.json({ data: audit, success: true });
  } catch (err) {
    console.error("AI audit error:", err);
    const msg = err instanceof Error ? err.message : "AI audit failed";
    return NextResponse.json({ error: msg, success: false }, { status: 500 });
  }
}
