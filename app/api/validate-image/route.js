import { NextResponse } from 'next/server';

const HF_TOKEN = process.env.HUGGING_FACE_API_KEY || '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';

/**
 * Call Hugging Face Inference API directly via REST.
 * This avoids the SDK's Blob conversion issues in Node.js serverless environments.
 */
async function hfClassify(model, imageBuffer) {
  const response = await fetch(
    `https://router.huggingface.co/hf-inference/models/${model}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/octet-stream',
      },
      body: imageBuffer,
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`HF API ${response.status}: ${errText}`);
  }

  return response.json();
}

export async function POST(req) {
  try {
    const { image, imageBase64, fileName = "", exifData = {} } = await req.json();
    const imageData = image || imageBase64;

    if (!imageData) {
      return NextResponse.json({ error: 'Missing image data' }, { status: 400 });
    }

    const base64Data = imageData.split(',')[1] || imageData;
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Log EXIF info for monitoring
    console.log('[Validate] EXIF received:', {
      hasExif: exifData?.hasExif,
      dateTaken: exifData?.dateTaken,
      lat: exifData?.lat,
      lng: exifData?.lng
    });

    let nsfwScore = 0;
    let structureConfidence = 85;

    // ── 1. Check for AI-generated images ──────────────────────
    try {
      const aiResult = await hfClassify('dima806/ai_vs_real_image_detection', imageBuffer);
      console.log('[Validate] AI detection raw result:', JSON.stringify(aiResult));

      // Model returns: [{ label: "AI", score: 0.99 }, { label: "Real", score: 0.01 }]
      // Handle both flat array and nested array formats
      const results = Array.isArray(aiResult?.[0]) ? aiResult[0] : aiResult;

      const aiPrediction = results.find(r =>
        ['ai', 'fake', 'synthetic', 'generated'].some(kw => r.label.toLowerCase().includes(kw))
      );

      if (aiPrediction && aiPrediction.score > 0.75) {
        return NextResponse.json({
          success: false,
          error: `AI-generated image detected (${Math.round(aiPrediction.score * 100)}% confidence). Please upload real photos only.`,
          score: Math.round(aiPrediction.score * 100),
        });
      }
    } catch (e) {
      console.warn('[Validate] AI detection failed:', e.message);
      // Don't block submission if AI detection is unavailable — graceful degradation
    }

    // ── 2. Check for NSFW content ─────────────────────────────
    try {
      const nsfwResult = await hfClassify('Falconsai/nsfw_image_detection', imageBuffer);
      nsfwScore = nsfwResult.find(r => r.label === 'nsfw')?.score || 0;
    } catch (e) {
      console.warn('[Validate] NSFW check failed:', e.message);
    }

    if (nsfwScore > 0.6) {
      return NextResponse.json({
        success: false,
        error: 'Inappropriate content detected.',
        score: Math.round(nsfwScore * 100),
      });
    }

    // ── 3. Check if image is civic infrastructure ─────────────
    try {
      const vitResult = await hfClassify('google/vit-base-patch16-224', imageBuffer);

      const civicKeywords = [
        'bridge', 'viaduct', 'suspension bridge', 'pier', 'dam',
        'street', 'road', 'building', 'structure', 'pothole', 'hole',
        'water', 'leak', 'light', 'garbage', 'waste', 'dump', 'trash',
        'pole', 'drain', 'sewer', 'sidewalk', 'pavement', 'manhole',
        'construction', 'fence', 'wall', 'crack', 'ruin',
      ];

      const isStructureRelated = vitResult.some(r =>
        civicKeywords.some(kw => r.label.toLowerCase().includes(kw)) && r.score > 0.08
      );

      if (!isStructureRelated) {
        console.warn('[Validate] Image does not appear to be civic infrastructure, but allowing for testing/fallback.');
        // We no longer block the submission here so that users can test the platform with any image.
      }

      structureConfidence = Math.round(vitResult[0].score * 100);
    } catch (e) {
      console.warn('[Validate] Structure check failed, allowing submission:', e.message);
    }

    return NextResponse.json({
      success: true,
      nsfwScore: Math.round(nsfwScore * 100),
      structureConfidence,
      exifInfo: exifData
    });
  } catch (error) {
    console.error('[Validate] Fatal error:', error);
    return NextResponse.json({ success: false, error: 'Image validation failed: ' + error.message });
  }
}
