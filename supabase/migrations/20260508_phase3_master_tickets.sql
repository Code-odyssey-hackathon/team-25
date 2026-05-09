-- Create Master Tickets table for deduplication and clustering
CREATE TABLE IF NOT EXISTS master_tickets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    bridge_id uuid REFERENCES bridges(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    severity text,
    damage_type text,
    status text DEFAULT 'PENDING_REVIEW',
    confidence_score float,
    assigned_department text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Add master_ticket_id to reports
ALTER TABLE reports ADD COLUMN IF NOT EXISTS master_ticket_id uuid REFERENCES master_tickets(id) ON DELETE SET NULL;

-- Create policy for master tickets
ALTER TABLE master_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view master tickets" ON master_tickets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND (raw_app_meta_data->>'role' = 'admin' OR raw_app_meta_data->>'authority' IS NOT NULL)
        )
    );

-- Log table for blockchain / immutable audit trailing
CREATE TABLE IF NOT EXISTS ledger_audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_id uuid NOT NULL,
    entity_type text NOT NULL, -- 'REPORT' or 'MASTER_TICKET'
    action text NOT NULL,
    previous_state jsonb,
    new_state jsonb,
    tx_hash text UNIQUE NOT NULL, -- Simulated blockchain tx hash
    timestamp timestamp with time zone DEFAULT now()
);

ALTER TABLE ledger_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view audit logs" ON ledger_audit_logs FOR SELECT USING (true);
