import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Simulated SpaCy NER PII Stripping
function stripPII(text) {
  if (!text) return text;
  // Simple regex mock for Aadhaar, Phone, Email
  let cleanText = text.replace(/\b\d{4}\s?\d{4}\s?\d{4}\b/g, '[AADHAAR-REDACTED]');
  cleanText = cleanText.replace(/\b[6-9]\d{9}\b/g, '[PHONE-REDACTED]');
  cleanText = cleanText.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL-REDACTED]');
  
  // Simulated NER name removal
  const names = ['Ramesh', 'Suresh', 'Mr. Kumar', 'Priya'];
  names.forEach(name => {
    cleanText = cleanText.replace(new RegExp(`\\b${name}\\b`, 'gi'), '[NAME-REDACTED]');
  });

  return cleanText;
}

// Simulated Llama-3-8B + ChromaDB Embedding and Clustering
async function generateEmbeddingAndCluster(text, bridgeId) {
  // Mock delay for AI processing
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return a mock master ticket ID based on the bridge (simulating that reports for the same bridge group together)
  const masterHash = crypto.createHash('md5').update(bridgeId).digest('hex');
  return `master-${masterHash.substring(0, 8)}`;
}

export async function POST(request) {
  try {
    const { report_id, raw_description, bridge_id } = await request.json();

    if (!report_id || !raw_description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log(`[Ingestion Pipeline] Processing report ${report_id}`);

    // 1. PII Stripping
    const safeDescription = stripPII(raw_description);
    console.log(`[Ingestion Pipeline] Stripped PII. Safe text: "${safeDescription.substring(0, 50)}..."`);

    // 2. Semantic Embedding & Clustering
    const masterTicketId = await generateEmbeddingAndCluster(safeDescription, bridge_id);
    console.log(`[Ingestion Pipeline] Clustered into Master Ticket: ${masterTicketId}`);

    // In a real implementation, we would update the `reports` table in Supabase
    // to set the `master_ticket_id` and the `description` to the safeDescription.

    return NextResponse.json({
      success: true,
      master_ticket_id: masterTicketId,
      stripped_text: safeDescription
    });

  } catch (error) {
    console.error('Ingestion Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
