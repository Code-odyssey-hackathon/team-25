import { NextResponse } from 'next/server';

const HF_TOKEN = process.env.HUGGING_FACE_API_KEY || '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';

/**
 * Call Hugging Face Inference API directly via REST.
 * Avoids the SDK's Blob conversion issues in Next.js serverless environments.
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

/**
 * Call CLIP zero-shot classification via REST.
 * Requires multipart/form-data with the image and candidate_labels as JSON.
 */
async function hfZeroShotClassify(model, imageBuffer, candidateLabels) {
  // CLIP zero-shot via the inference API uses JSON payload with base64 image
  const base64Image = imageBuffer.toString('base64');

  const response = await fetch(
    `https://router.huggingface.co/hf-inference/models/${model}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: base64Image,
        parameters: { candidate_labels: candidateLabels },
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`HF CLIP API ${response.status}: ${errText}`);
  }

  return response.json();
}

// Natural-language descriptions for zero-shot classification
const CANDIDATE_LABELS = [
  'a pothole on a road or street',
  'cracks on road or pavement surface',
  'a water leak or burst pipe or flooding',
  'a broken or non-functional streetlight or lamp post',
  'garbage dump or trash or waste accumulation on street',
  'structural damage to a building or wall or bridge',
  'a blocked or clogged drainage or sewer',
  'a general outdoor scene or landscape'
];

const LABEL_TO_ISSUE = {
  0: 'POTHOLE',
  1: 'ROAD_CRACK',
  2: 'WATER_LEAK',
  3: 'STREETLIGHT_OUT',
  4: 'GARBAGE_DUMP',
  5: 'STRUCTURAL_DAMAGE',
  6: 'DRAINAGE_ISSUE',
  7: 'OTHER'
};

const DESCRIPTION_TEMPLATES = {
  'POTHOLE': 'Significant pothole detected on the road surface. This poses a risk to vehicles and pedestrians and requires immediate repair.',
  'ROAD_CRACK': 'Visible cracks detected on the road surface. These cracks may expand over time and should be repaired to prevent further damage.',
  'WATER_LEAK': 'Water leak detected in the infrastructure. This may indicate a damaged pipe or drainage issue that needs immediate attention.',
  'STREETLIGHT_OUT': 'Streetlight malfunction detected. The light appears to be non-functional, which creates safety concerns for pedestrians and drivers.',
  'GARBAGE_DUMP': 'Illegal garbage dumping or waste accumulation detected. This poses environmental and health risks and requires cleanup.',
  'STRUCTURAL_DAMAGE': 'Structural damage detected to infrastructure. This may include cracks, deterioration, or other structural issues that require professional assessment.',
  'DRAINAGE_ISSUE': 'Drainage system issue detected. This may include blocked drains, poor water flow, or flooding risks that need maintenance.',
  'OTHER': 'Infrastructure issue detected that requires attention and assessment by authorities.'
};

// Expanded keyword mapping for VIT fallback
const VIT_LABEL_MAP = {
  'POTHOLE': [
    'manhole cover', 'storm drain', 'gutter', 'street sign', 'traffic light',
    'road', 'highway', 'lane', 'alley', 'parking meter',
    'tire', 'wheel', 'car wheel', 'pickup truck', 'tow truck'
  ],
  'ROAD_CRACK': [
    'sidewalk', 'patio', 'stone wall', 'gravel', 'sandbar',
    'boardwalk', 'breakwater', 'dam', 'cliff', 'promontory'
  ],
  'WATER_LEAK': [
    'fountain', 'geyser', 'dam', 'reservoir', 'lakeside',
    'pipeline', 'plunger', 'bathtub', 'washbasin', 'shower curtain',
    'water tower', 'water jug', 'water bottle', 'swimming pool'
  ],
  'STREETLIGHT_OUT': [
    'street sign', 'traffic light', 'lampshade', 'spotlight', 'torch',
    'candle', 'chandelier', 'table lamp', 'desk lamp', 'pole',
    'flagpole', 'maypole', 'totem pole'
  ],
  'GARBAGE_DUMP': [
    'shopping cart', 'plastic bag', 'garbage truck', 'dumpster',
    'cardboard', 'envelope', 'carton', 'crate', 'bucket',
    'wastepaper basket', 'hamper', 'bin', 'barrel', 'bag'
  ],
  'STRUCTURAL_DAMAGE': [
    'castle', 'church', 'monastery', 'palace', 'bell tower',
    'brick', 'tile roof', 'dome', 'arch', 'pillar',
    'pier', 'bridge', 'viaduct', 'suspension bridge', 'steel arch bridge',
    'barn', 'greenhouse', 'mobile home', 'cinema', 'library',
    'prison', 'mosque', 'stupa', 'beacon', 'lighthouse'
  ],
  'DRAINAGE_ISSUE': [
    'manhole cover', 'grate', 'chain-link fence', 'iron',
    'colander', 'strainer', 'sieve', 'honeycomb',
    'storm drain', 'sewer', 'culvert'
  ]
};

export async function POST(req) {
  try {
    const { image, imageBase64, fileName = "" } = await req.json();
    const imageData = image || imageBase64;

    if (!imageData) {
      return NextResponse.json({ error: 'Missing image data' }, { status: 400 });
    }

    const base64Data = imageData.split(',')[1] || imageData;
    const imageBuffer = Buffer.from(base64Data, 'base64');

    let detectedIssue = 'OTHER';
    let confidence = 0;
    let description = DESCRIPTION_TEMPLATES['OTHER'];
    let method = 'none';

    // ── Strategy 1: CLIP Zero-Shot Classification (most accurate) ──
    try {
      const result = await hfZeroShotClassify(
        'openai/clip-vit-base-patch32',
        imageBuffer,
        CANDIDATE_LABELS
      );

      console.log('[Classify] CLIP zero-shot result:', JSON.stringify(result));

      // Handle both flat array and nested formats
      const results = Array.isArray(result) ? result : (result?.scores ? 
        result.labels.map((label, i) => ({ label, score: result.scores[i] })) : []);

      if (results.length > 0) {
        const best = results.reduce((a, b) => a.score > b.score ? a : b);
        const bestIdx = CANDIDATE_LABELS.indexOf(best.label);

        if (bestIdx >= 0 && bestIdx < 7 && best.score > 0.15) {
          detectedIssue = LABEL_TO_ISSUE[bestIdx];
          confidence = best.score;
          description = DESCRIPTION_TEMPLATES[detectedIssue];
          method = 'clip-zero-shot';
        }
      }
    } catch (clipErr) {
      console.warn('[Classify] CLIP zero-shot failed, falling back to ViT:', clipErr.message);
    }

    // ── Strategy 2: ViT general classification + smart mapping ──
    if (method === 'none') {
      try {
        const result = await hfClassify('google/vit-base-patch16-224', imageBuffer);

        console.log('[Classify] ViT result:', JSON.stringify(result?.slice?.(0, 5)));

        const results = Array.isArray(result) ? result : [];

        if (results.length > 0) {
          const issueScores = {};

          for (const [issueType, vitLabels] of Object.entries(VIT_LABEL_MAP)) {
            issueScores[issueType] = 0;
            for (const prediction of results) {
              const predLabel = prediction.label.toLowerCase();
              for (const vitLabel of vitLabels) {
                if (predLabel.includes(vitLabel.toLowerCase()) || vitLabel.toLowerCase().includes(predLabel)) {
                  issueScores[issueType] += prediction.score;
                }
              }
            }
          }

          let bestType = 'OTHER';
          let bestTypeScore = 0;
          for (const [issueType, score] of Object.entries(issueScores)) {
            if (score > bestTypeScore) {
              bestType = issueType;
              bestTypeScore = score;
            }
          }

          if (bestTypeScore > 0.05) {
            detectedIssue = bestType;
            confidence = Math.min(bestTypeScore, 0.99);
            description = DESCRIPTION_TEMPLATES[detectedIssue];
            method = 'vit-mapped';
          } else {
            const topLabel = results[0]?.label?.toLowerCase() || '';
            const outdoorKeywords = ['street', 'road', 'building', 'bridge', 'house', 'fence', 'sign', 'car', 'truck', 'bus', 'bicycle'];
            const isOutdoor = outdoorKeywords.some(k => topLabel.includes(k));

            if (isOutdoor) {
              detectedIssue = 'STRUCTURAL_DAMAGE';
              confidence = results[0]?.score || 0.5;
              description = DESCRIPTION_TEMPLATES['STRUCTURAL_DAMAGE'];
              method = 'vit-outdoor-heuristic';
            } else {
              detectedIssue = 'OTHER';
              confidence = results[0]?.score || 0.5;
              description = DESCRIPTION_TEMPLATES['OTHER'];
              method = 'vit-fallback';
            }
          }
        }
      } catch (vitErr) {
        console.warn('[Classify] ViT classification failed:', vitErr.message);
        detectedIssue = 'OTHER';
        confidence = 0.5;
        description = DESCRIPTION_TEMPLATES['OTHER'];
        method = 'error-fallback';
      }
    }

    return NextResponse.json({
      success: true,
      issue_type: detectedIssue,
      confidence: Math.round(confidence * 100),
      description: description,
      method: method
    });

  } catch (error) {
    console.error('[Classify] Fatal error:', error);
    return NextResponse.json({
      success: true,
      issue_type: 'OTHER',
      confidence: 50,
      description: DESCRIPTION_TEMPLATES['OTHER'],
      method: 'fatal-fallback'
    });
  }
}