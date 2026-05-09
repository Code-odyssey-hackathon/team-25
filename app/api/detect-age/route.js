import { NextResponse } from 'next/server';

const HF_TOKEN = process.env.HUGGING_FACE_API_KEY;
const HF_REQUEST_TIMEOUT = 30_000;

/**
 * Call Hugging Face Inference API with proper timeout and headers.
 * Consistent with validate-image and other HF routes.
 */
async function hfClassify(model, imageBuffer, timeoutMs = HF_REQUEST_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(
      `https://router.huggingface.co/hf-inference/models/${model}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/octet-stream',
          'Accept': 'application/json',
        },
        body: imageBuffer,
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HF API ${response.status}: ${errText}`);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`HF API request timed out after ${timeoutMs / 1000}s`);
    }
    throw error;
  }
}

export async function POST(request) {
  if (!HF_TOKEN) {
    return NextResponse.json(
      { success: true, isVulnerable: false, category: 'unknown', confidence: 0, warning: 'Age detection unavailable (not configured)' },
      { status: 200 }
    );
  }

  try {
    // FIX A-1: Accept both field names for backward compatibility
    const { image, imageBase64 } = await request.json();
    const imageData = image || imageBase64;

    if (!imageData) {
      return NextResponse.json({ error: 'Missing image data' }, { status: 400 });
    }

    const base64Data = imageData.split(',')[1] || imageData;
    const imageBuffer = Buffer.from(base64Data, 'base64');

    const result = await hfClassify('nateraw/vit-age-classifier', imageBuffer);
    const results = Array.isArray(result?.[0]) ? result[0] : result;

    const isOld = results.some(r =>
      ['60-69', '70-79', '80-89', '90-99'].includes(r.label) && r.score > 0.4
    );
    const isBaby = results.some(r =>
      ['0-2', '3-9'].includes(r.label) && r.score > 0.4
    );

    let confidence = 0;
    if (isOld) confidence = results.find(r => ['60-69', '70-79', '80-89', '90-99'].includes(r.label))?.score || 0;
    if (isBaby) confidence = results.find(r => ['0-2', '3-9'].includes(r.label))?.score || 0;

    return NextResponse.json({
      success: true,
      isVulnerable: isOld || isBaby,
      category: isOld ? 'elderly' : isBaby ? 'child' : 'adult',
      confidence: Math.round(confidence * 100)
    });
  } catch (error) {
    console.error('Age detection error:', error);
    // Graceful degradation — don't block submission if age detection fails
    return NextResponse.json({
      success: true,
      isVulnerable: false,
      category: 'unknown',
      confidence: 0,
      warning: 'Age detection unavailable: ' + error.message
    });
  }
}