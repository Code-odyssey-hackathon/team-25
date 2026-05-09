import { supabase } from './supabase';

/**
 * Escalate a master ticket to the next SLA level
 * Simulated LangGraph state machine step.
 */
export async function escalateTicket(masterTicketId) {
  try {
    const { data: ticket, error: fetchError } = await supabase
      .from('master_tickets')
      .select('status, assigned_department')
      .eq('id', masterTicketId)
      .single();

    if (fetchError) throw fetchError;

    // SLA Ladder State Machine
    const escalationLadder = {
      'PENDING_REVIEW': 'ESCALATED_L1', // GRO -> Executive Engineer
      'ESCALATED_L1': 'ESCALATED_L2',   // Executive -> Chief Engineer
      'ESCALATED_L2': 'ESCALATED_L3',   // Chief -> Secretary PWD
      'ESCALATED_L3': 'ESCALATED_L4',   // Secretary -> Minister
    };

    const nextStatus = escalationLadder[ticket.status] || ticket.status;

    if (nextStatus === ticket.status) {
      return { success: false, message: 'Max escalation reached' };
    }

    const { error: updateError } = await supabase
      .from('master_tickets')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', masterTicketId);

    if (updateError) throw updateError;

    // Twilio Notification trigger mock
    await fetch(process.env.NEXT_PUBLIC_APP_URL + '/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ticket_id: masterTicketId, 
        new_level: nextStatus,
        department: ticket.assigned_department
      })
    }).catch(console.error); // Fire and forget

    return { success: true, new_status: nextStatus };
  } catch (err) {
    console.error('Escalation failed:', err);
    throw err;
  }
}
