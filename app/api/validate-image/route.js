import { NextResponse } from 'next/server';
import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HUGGING_FACE_API_KEY);

export async function POST(req) {
  try {
    const { image } = await req.json();
    if (!image) {
      return NextResponse.json({ error: 'Missing image data' }, { status: 400 });
    }

    const base64Data = image.split(',')[1];
    const imageBuffer = Buffer.from(base64Data, 'base64');
    const result = await hf.imageClassification({
      model: 'Falconsai/nsfw_image_detection',
      data: imageBuffer
    });

    const nsfwScore = result.find(r => r.label === 'nsfw')?.score || 0;
    if (nsfwScore > 0.6) {
      return NextResponse.json({
        success: false,
        error: 'Inappropriate content detected.',
        score: Math.round(nsfwScore * 100)
      });
    }

    const bridgeResult = await hf.imageClassification({
      model: 'google/vit-base-patch16-224',
      data: imageBuffer
    });

    const isBridgeRelated = bridgeResult.some(r => 
      ['bridge', 'viaduct', 'suspension bridge', 'pier', 'dam'].includes(r.label) && r.score > 0.1
    );

    if (!isBridgeRelated) {
      return NextResponse.json({
        success: false,
        error: 'Image does not appear to be a bridge or structure.',
        topLabels: bridgeResult.slice(0, 3).map(r => r.label)
      });
    }

    return NextResponse.json({
      success: true,
      nsfwScore: Math.round(nsfwScore * 100),
      bridgeConfidence: Math.round(bridgeResult[0].score * 100)
    });
  } catch (error) {
    console.error('Image validation error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
