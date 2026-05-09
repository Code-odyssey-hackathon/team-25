import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image');

    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    console.log(`[Gemini Flash Mock] Parsing image for damage and EXIF...`);
    
    // Simulate Gemini 1.5 Flash API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock response extraction
    return NextResponse.json({
      success: true,
      damage_type: "SPALLING",
      severity: "SERIOUS",
      confidence: 0.92,
      exif_gps: {
        lat: 15.3647,
        lng: 75.1240
      }
    });

  } catch (error) {
    console.error('Image Parse Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
