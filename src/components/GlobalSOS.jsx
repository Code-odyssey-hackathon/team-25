import { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { FLAGS } from '../lib/features';

export default function GlobalSOS() {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  if (!FLAGS.ENABLE_SOS) return null;

  const handleSOS = async () => {
    if (window.confirm('WARNING: This triggers an immediate emergency escalation to NDRF/SDRF. Are you sure you want to declare an SOS?')) {
      setLoading(true);
      try {
        // Mock API call to SOS endpoint
        await new Promise(r => setTimeout(r, 1500));
        showToast('SOS ALARM TRIGGERED. NDRF Notified. Hold your position.', 'error');
      } catch (err) {
        showToast('Failed to trigger SOS', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <button
      onClick={handleSOS}
      disabled={loading}
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        backgroundColor: '#ef4444',
        color: '#fff',
        border: '4px solid rgba(239, 68, 68, 0.4)',
        boxShadow: '0 10px 25px rgba(239, 68, 68, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 900,
        fontSize: '1.2rem',
        cursor: 'pointer',
        zIndex: 9999,
        animation: 'pulse-crit 2s infinite'
      }}
      title="Emergency SOS"
    >
      {loading ? '...' : 'SOS'}
    </button>
  );
}
