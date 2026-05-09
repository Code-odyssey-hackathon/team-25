import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { ticket_id, new_level, department } = await request.json();

    if (!ticket_id) {
      return NextResponse.json({ error: 'Ticket ID required' }, { status: 400 });
    }

    // Mock Twilio SMS Dispatch
    console.log(`[Twilio Mock] SMS Dispatched: "URGENT: Ticket ${ticket_id} has been escalated to ${new_level} for department ${department}. Immediate action required."`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json({
      success: true,
      message: 'Notification dispatched to relevant authorities.'
    });

  } catch (error) {
    console.error('Notification Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
