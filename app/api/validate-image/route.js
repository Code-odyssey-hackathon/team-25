import { NextResponse } from 'next/server';

// ──────────────────────────────────────────────────────────────
// Configuration
// ──────────────────────────────────────────────────────────────
const HF_TOKEN = process.env.HUGGING_FACE_API_KEY;
const HF_API_BASE = 'https://router.huggingface.co/hf-inference/models';
const HF_REQUEST_TIMEOUT = 30_000; // 30 seconds
const AI_CONFIDENCE_THRESHOLD = 0.75;
const NSFW_THRESHOLD = 0.6;

// Known label keywords that indicate AI-generated content
const AI_LABEL_KEYWORDS = [
  'ai', 'fake', 'synthetic', 'generated',
  'aigenerated', 'artificial', 'machine-generated',
  'diffusion', 'gan', 'stable-diffusion',
  'dalle', 'midjourney', 'fabricated',
];

// Civic infrastructure keywords for ViT classification
const CIVIC_KEYWORDS = [
  'street', 'road', 'building', 'structure', 'pothole', 'hole',
  'water', 'leak', 'light', 'garbage', 'waste', 'dump', 'trash',
  'pole', 'drain', 'sewer', 'sidewalk', 'pavement', 'manhole',
  'construction', 'fence', 'wall', 'crack', 'ruin', 'bridge',
  'highway', 'asphalt', 'concrete', 'damaged', 'infrastructure',
];

// ──────────────────────────────────────────────────────────────
// Hugging Face Inference Helper
// ──────────────────────────────────────────────────────────────
/**
 * Call Hugging Face Inference API with proper timeout and headers.
 * Returns parsed JSON or throws with diagnostic info.
 */
async function hfClassify(model, imageBuffer, timeoutMs = HF_REQUEST_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `${HF_API_BASE}/${encodeURIComponent(model)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/octet-stream',
        'Accept': 'application/json',
      },
      body: imageBuffer,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();

    if (!response.ok) {
      // Try to parse as JSON error, fall back to raw text
      let jsonErr;
      try {
        jsonErr = JSON.parse(text);
      } catch (_) { /* not JSON */ }

      const statusText = jsonErr?.error?.message || text.slice(0, 200);
      throw new Error(`HF API ${response.status} (${response.statusText}): ${statusText}`);
    }

    if (!contentType.includes('application/json')) {
      throw new Error(`HF API returned non-JSON content-type: "${contentType}"`);
    }

    return JSON.parse(text);
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`HF API request timed out after ${timeoutMs / 1000}s`);
    }
    throw error;
  }
}

/**
 * Safely classify with retry logic for transient failures.
 * Retries up to 2 times on network/timeout errors.
 */
async function hfClassifyWithRetry(model, imageBuffer, maxRetries = 2) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await hfClassify(model, imageBuffer);
    } catch (error) {
      lastError = error;

      // Don't retry for auth errors or bad requests
      if (error.message.includes('401') || error.message.includes('403') ||
          error.message.includes('400')) {
        break;
      }

      // Only retry on timeout or network errors
      const isTransient =
        error.message.includes('timed out') ||
        error.message.includes('fetch') ||
        error.message.includes('ECONN');

      if (!isTransient || attempt === maxRetries) break;

      const backoffMs = 1000 * Math.pow(2, attempt);
      console.warn(`[Validate] Retry attempt ${attempt + 1}/${maxRetries} after ${backoffMs}ms`);
      await new Promise((r) => setTimeout(r, backoffMs));
    }
  }

  throw lastError;
}

// ──────────────────────────────────────────────────────────────
// Main Handler
// ──────────────────────────────────────────────────────────────
export async function POST(req) {
  // Validate environment
  if (!HF_TOKEN) {
    console.error('[Validate] HUGGING_FACE_API_KEY is not set in environment');
    return NextResponse.json(
      { success: true, warning: 'AI validation unavailable (not configured)', nsfwScore: 0, structureConfidence: 0 },
      { status: 200 }  // Return 200 so the UI gracefully degrades
    );
  }

  try {
    const { image, imageBase64, fileName = '', exifData = {} } = await req.json();
    const imageData = image || imageBase64;

    if (!imageData) {
      return NextResponse.json({ error: 'Missing image data' }, { status: 400 });
    }

    const base64Data = imageData.split(',')[1] || imageData;
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Validate that the buffer is a real image
    if (imageBuffer.length < 100) {
      return NextResponse.json({ error: 'Image data too small to be valid' }, { status: 400 });
    }

    console.log('[Validate] Processing image:', {
      size: imageBuffer.length,
      hasExif: exifData?.hasExif,
      dateTaken: exifData?.dateTaken,
    });

    let nsfwScore = 0;
    let structureConfidence = 85;

    // ── 1. Check for AI-generated images ──────────────────────
    let aiDetectionWarning = null;
    try {
      const aiResult = await hfClassifyWithRetry('dima806/ai_vs_real_image_detection', imageBuffer);
      console.log('[Validate] AI detection raw result:', JSON.stringify(aiResult));

      // Normalize result: handle flat array or nested array format
      const results = Array.isArray(aiResult?.[0]) ? aiResult[0] : aiResult;

      if (!Array.isArray(results) || results.length === 0) {
        console.warn('[Validate] AI detection returned empty/unexpected result, using fallback');
        aiDetectionWarning = 'AI detection returned unexpected format';
      } else {
        // Find the best AI-generated match using comprehensive keyword list
        const aiPrediction = results.find(r =>
          AI_LABEL_KEYWORDS.some(kw =>
            (r.label || '').toString().toLowerCase().includes(kw)
          )
        );

        // Also check if the top-1 label is "generated" with high confidence
        const topResult = results[0];
        const isAIGenerated = aiPrediction
          ? aiPrediction.score > AI_CONFIDENCE_THRESHOLD
          : (topResult &&
             topResult.label &&
             topResult.label.toString().toLowerCase().includes('generated') &&
             topResult.score > AI_CONFIDENCE_THRESHOLD);

        if (isAIGenerated) {
          const detectedLabel = aiPrediction?.label || topResult?.label || 'AI-generated';
          const detectedScore = aiPrediction?.score || topResult?.score || 0;
          console.log('[Validate] AI-generated content detected:', detectedLabel, detectedScore);
          return NextResponse.json({
            success: false,
            error: `AI-generated image detected (${Math.round(detectedScore * 100)}% confidence). Please upload real photos only.`,
            detectedLabel: detectedLabel.toString(),
            score: Math.round(detectedScore * 100),
          });
        }
      }
    } catch (error) {
      const msg = error.message || String(error);
      console.warn('[Validate] AI detection failed:', msg);

      // Distinguish between model-loading (transient) vs auth/permanent errors
      if (msg.includes('loading') || msg.includes('timed out')) {
        aiDetectionWarning = 'AI model is loading, please try again shortly';
      } else if (msg.includes('401') || msg.includes('403')) {
        console.error('[Validate] HF authentication error — check HUGGING_FACE_API_KEY');
        aiDetectionWarning = 'AI validation misconfigured (invalid API key)';
      } else {
        aiDetectionWarning = 'AI detection temporarily unavailable';
      }
    }

    // ── 2. Check for NSFW content ─────────────────────────────
    try {
      const nsfwResult = await hfClassifyWithRetry('Falconsai/nsfw_image_detection', imageBuffer);
      const nsfwArray = Array.isArray(nsfwResult?.[0]) ? nsfwResult[0] : nsfwResult;

      if (Array.isArray(nsfwArray)) {
        nsfwScore = nsfwArray.find(r => r.label === 'nsfw')?.score || 0;
      }
    } catch (error) {
      console.warn('[Validate] NSFW check failed:', error.message);
      // Non-blocking: proceed without NSFW score
    }

    if (nsfwScore > NSFW_THRESHOLD) {
      return NextResponse.json({
        success: false,
        error: 'Inappropriate content detected.',
        score: Math.round(nsfwScore * 100),
      });
    }

    // ── 3. Check if image is civic infrastructure ─────────────
    try {
      const vitResult = await hfClassifyWithRetry('google/vit-base-patch16-224', imageBuffer);
      const vitArray = Array.isArray(vitResult?.[0]) ? vitResult[0] : vitResult;

      const isStructureRelated = Array.isArray(vitArray) && vitArray.some(r =>
        CIVIC_KEYWORDS.some(kw => (r.label || '').toString().toLowerCase().includes(kw)) && r.score > 0.08
      );

      if (!isStructureRelated) {
        console.warn('[Validate] Image may not be civic infrastructure — flagging but allowing');
      }

      structureConfidence = Math.round((vitArray?.[0]?.score ?? 0.85) * 100);
    } catch (error) {
      console.warn('[Validate] Structure classification failed:', error.message);
      // Use default confidence
    }

    // ── Return success with all diagnostics ─────────────
    const apiResponse = {
      success: true,
      nsfwScore: Math.round(nsfwScore * 100),
      structureConfidence,
      exifInfo: exifData,
    };

    // Include warning if AI detection couldn't run
    if (aiDetectionWarning) {
      apiResponse.aiDetectionWarning = aiDetectionWarning;
    }

    return NextResponse.json(apiResponse);

  } catch (error) {
    console.error('[Validate] Fatal error:', error);
    return NextResponse.json(
      { success: true, warning: 'Validation error, proceeding without AI check: ' + error.message },
      { status: 200 }  // Return 200 to avoid blocking the client entirely
    );
  }
}