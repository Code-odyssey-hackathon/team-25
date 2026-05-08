import { NextRequest, NextResponse } from "next/server";
import { getGeminiFlash, PROMPTS } from "@/lib/gemini";

// POST /api/ai/classify — Classify an image using Gemini 1.5 Flash
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Image file is required", success: false }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type || "image/jpeg";

    // Call Gemini
    const result = await getGeminiFlash().generateContent([
      { text: PROMPTS.CLASSIFY_IMAGE },
      { inlineData: { mimeType, data: base64 } },
    ]);

    const text = result.response.text();
    let classification;
    try {
      classification = JSON.parse(text);
    } catch {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        classification = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse AI response");
      }
    }

    // Validate and sanitize
    const validCategories = ["pothole", "garbage", "water_leak", "streetlight", "road_damage", "drainage", "encroachment", "other"];
    if (!validCategories.includes(classification.category)) {
      classification.category = "other";
    }
    classification.confidence = Math.max(0, Math.min(1, Number(classification.confidence) || 0.5));
    classification.severity = Math.max(1, Math.min(10, Math.round(Number(classification.severity) || 5)));

    return NextResponse.json({ data: classification, success: true });
  } catch (err) {
    console.error("AI classify error:", err);
    const msg = err instanceof Error ? err.message : "AI classification failed";
    return NextResponse.json({ error: msg, success: false }, { status: 500 });
  }
}
