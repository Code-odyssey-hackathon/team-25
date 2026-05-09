import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function UpvoteButton({ reportId, initialCount = 0 }) {
  const [upvotes, setUpvotes] = useState(initialCount);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    // In a full implementation, we would query the backend here
    // to check if the current user has already upvoted this report.
    // For now, we rely on local state or the initial props.
  }, [reportId, user]);

  const handleUpvote = async () => {
    if (!user) {
      showToast('You must be logged in to upvote a report.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/upvote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_id: reportId, citizen_id: user.id }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upvote');
      }

      if (data.action === 'added') {
        setUpvotes(prev => prev + 1);
        setHasUpvoted(true);
        showToast('You upvoted this report. Priority score increased!', 'success');
      } else {
        setUpvotes(prev => Math.max(0, prev - 1));
        setHasUpvoted(false);
        showToast('Upvote removed.', 'info');
      }
    } catch (error) {
      console.error('Upvote error:', error);
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleUpvote}
      disabled={loading}
      className="btn-secondary"
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.4rem',
        padding: '0.4rem 0.8rem',
        fontSize: '0.85rem',
        background: hasUpvoted ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
        borderColor: hasUpvoted ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)',
        color: hasUpvoted ? '#60a5fa' : '#a1a1aa',
        transition: 'all 0.2s ease',
      }}
    >
      <span style={{ fontSize: '1.1rem' }}>{hasUpvoted ? '👍' : '👍'}</span>
      <span style={{ fontWeight: 600 }}>{upvotes}</span>
      <span style={{ display: 'none' }} className="sm-show"> Me Too</span>
    </button>
  );
}
