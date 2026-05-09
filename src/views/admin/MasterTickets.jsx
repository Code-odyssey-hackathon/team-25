import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function MasterTickets() {
  const router = useRouter();
  const { authority, loading: authLoading, isAdmin } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/admin/login');
    }
  }, [authLoading, isAdmin, router]);

  useEffect(() => {
    // Mock fetching Master Tickets since table might not be fully populated yet
    const fetchTickets = async () => {
      // Simulate API delay
      await new Promise(r => setTimeout(r, 1000));
      setTickets([
        {
          id: 'mt-001',
          title: 'Severe Foundation Scouring at Location #L-102',
          bridge_name: 'Gambhira Structure',
          severity: 'CRITICAL',
          report_count: 14,
          confidence_score: 0.96,
          status: 'ESCALATED_L2',
          created_at: new Date().toISOString()
        },
        {
          id: 'mt-002',
          title: 'Multiple Potholes and Spalling on Deck',
          bridge_name: 'Old Hubli Flyover',
          severity: 'WARNING',
          report_count: 5,
          confidence_score: 0.82,
          status: 'PENDING_REVIEW',
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ]);
      setLoading(false);
    };

    if (isAdmin) {
      fetchTickets();
    }
  }, [isAdmin]);

  if (authLoading || !isAdmin) return <div className="spinner" style={{ margin: '5rem auto' }}></div>;

  return (
    <div className="page-container">
      <div className="flex-between" style={{ marginBottom: '2rem', borderBottom: '1px solid var(--color-glass-border)', paddingBottom: '1rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>🧠 Master Tickets (AI Clustered)</h1>
        <button className="btn-secondary" onClick={() => router.push('/admin/dashboard')}>Back to Dashboard</button>
      </div>

      <p className="text-gray" style={{ marginBottom: '2rem' }}>
        AI automatically groups duplicate citizen reports into a single Master Ticket to reduce noise and highlight severe infrastructure failures.
      </p>

      {loading ? (
        <div className="spinner" style={{ margin: '2rem auto' }}></div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {tickets.map(t => (
            <div key={t.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderLeft: `4px solid ${t.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b'}` }}>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>{t.title}</h3>
                <p style={{ margin: '0 0 0.5rem 0', color: '#94a3b8' }}>📍 {t.bridge_name}</p>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                  <span className="badge" style={{ background: t.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b', color: '#fff' }}>{t.severity}</span>
                  <span className="badge" style={{ background: 'rgba(59,130,246,0.2)', color: '#60a5fa', border: '1px solid #3b82f6' }}>📸 {t.report_count} Clustered Reports</span>
                  <span className="badge" style={{ background: 'rgba(16,185,129,0.2)', color: '#34d399', border: '1px solid #10b981' }}>🤖 {t.confidence_score * 100}% Confidence</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>{new Date(t.created_at).toLocaleDateString()}</span>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: '#f8fafc' }}>{t.status.replace('_', ' ')}</span>
                <button className="btn-primary" style={{ display: 'block', marginTop: '1rem', padding: '0.4rem 1rem' }}>Review Details</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
