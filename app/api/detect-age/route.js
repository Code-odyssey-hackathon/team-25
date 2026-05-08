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
      model: 'nateraw/vit-age-classifier',
      data: imageBuffer
    });

    const isOld = result.some(r => 
      ['60-69', '70-79', '80-89', '90-99'].includes(r.label) && r.score > 0.4
    );
    const isBaby = result.some(r => 
      ['0-2', '3-9'].includes(r.label) && r.score > 0.4
    );

    let confidence = 0;
    if (isOld) confidence = result.find(r => ['60-69', '70-79', '80-89', '90-99'].includes(r.label))?.score || 0;
    if (isBaby) confidence = result.find(r => ['0-2', '3-9'].includes(r.label))?.score || 0;

    return NextResponse.json({
      success: true,
      isVulnerable: isOld || isBaby,
      category: isOld ? 'elderly' : isBaby ? 'child' : 'adult',
      confidence: Math.round(confidence * 100)
    });
  } catch (error) {
    console.error('Age detection error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
