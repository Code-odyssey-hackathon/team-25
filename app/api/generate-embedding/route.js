import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      return NextResponse.json({ error: 'Missing image data' }, { status: 400 });
    }

    const hfToken = process.env.HUGGING_FACE_API_KEY;
    if (!hfToken) {
      console.warn('[Embedding] HUGGING_FACE_API_KEY not configured');
      return NextResponse.json({
        success: false,
        error: 'CLIP embedding service not configured'
      }, { status: 503 });
    }

    // Extract base64 data
    const base64Data = imageBase64.split(',')[1] || imageBase64;
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Call Hugging Face CLIP model for embeddings
    const response = await fetch(
      'https://router.huggingface.co/hf-inference/models/openai/clip-vit-base-patch32',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfToken}`,
          'Content-Type': 'application/octet-stream',
        },
        body: imageBuffer,
      }
    );

    if (!response.ok) {
      console.error('[Embedding] HF API error:', response.status, response.statusText);
      return NextResponse.json({
        success: false,
        error: 'Failed to generate embedding'
      }, { status: 500 });
    }

    const result = await response.json();
    
    // Extract embedding from the response
    const embedding = result[0]?.embedding || result.embedding;
    
    if (!embedding || !Array.isArray(embedding)) {
      console.error('[Embedding] Invalid embedding response:', result);
      return NextResponse.json({
        success: false,
        error: 'Invalid embedding response'
      }, { status: 500 });
    }

    console.log('[Embedding] Successfully generated CLIP embedding');
    return NextResponse.json({
      success: true,
      embedding: embedding
    });

  } catch (error) {
    console.error('[Embedding] Error generating embedding:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}