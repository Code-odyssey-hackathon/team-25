/**
 * JanaVaani — Unified Login
 * 
 * Smart role-detecting login. Uses signIn() and auto-routes
 * based on AuthContext resolution: Authority → Admin, Engineer → Engineer, else Citizen.
 * This page is the fallback — each persona has its own dedicated login interface.
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { signIn } from '../lib/auth';

export default function UnifiedLogin() {
  const router = useRouter();
  const { user, authority, engineer, loading: authLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auto-route based on detected persona
  useEffect(() => {
    if (authLoading) return;
    if (user) {
      if (authority) router.push('/admin/dashboard');
      else if (engineer) router.push('/engineer/dashboard');
      else router.push('/citizen/profile');
    }
  }, [user, authority, engineer, authLoading, router]);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signIn(email, password);
      // AuthContext will trigger useEffect and redirect
    } catch (err) {
      // If not an authority, try redirecting to engineer login instead
      if (err.message?.includes('admin privileges')) {
        setError('This account is not an authority. Try the Engineer or Citizen login instead.');
      } else {
        setError(err.message || 'Failed to login');
      }
      setLoading(false);
    }
  }

  if (authLoading) {
    return <div style={styles.page}><div className="spinner" /></div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>📋</div>
        <h1 style={styles.title}>JanaVaani Access</h1>
        <p style={styles.sub}>Sign in to your Civic Portal</p>
        
        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleLogin} style={styles.form}>
          <div>
            <label style={styles.label}>Email Address</label>
            <input 
              type="email" className="form-input" 
              value={email} onChange={e => setEmail(e.target.value)} 
              placeholder="e.g. user@karnataka.gov.in" required 
            />
          </div>
          <div>
            <label style={styles.label}>Password</label>
            <input 
              type="password" className="form-input" 
              value={password} onChange={e => setPassword(e.target.value)} 
              placeholder="••••••••" required 
            />
          </div>
          <button type="submit" className="btn-primary" style={{ padding: '0.75rem' }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>

        <div style={styles.footer}>
          <p style={styles.footerText}>Looking for a specific portal?</p>
          <div style={styles.footerLinks}>
            <button style={{...styles.linkBtn, color: '#10b981'}} onClick={() => router.push('/citizen/login')}>👤 Citizen</button>
            <button style={{...styles.linkBtn, color: '#ef4444'}} onClick={() => router.push('/admin/login')}>🛡️ Authority</button>
            <button style={{...styles.linkBtn, color: '#06b6d4'}} onClick={() => router.push('/engineer/login')}>🔧 Engineer</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--color-bg)', padding: '2rem',
  },
  card: {
    width: '100%', maxWidth: 450, padding: '3rem 2rem', textAlign: 'center',
    background: 'rgba(15,23,42,0.8)', borderRadius: 20,
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
    backdropFilter: 'blur(20px)',
  },
  logo: { fontSize: '3rem', marginBottom: '1rem' },
  title: { fontSize: '2.2rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' },
  sub: { color: '#94a3b8', marginBottom: '2rem' },
  error: {
    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 10, padding: '0.75rem', color: '#fca5a5', fontSize: '0.9rem',
    marginBottom: '1.5rem',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' },
  label: { fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '0.4rem' },
  footer: {
    marginTop: '2rem', paddingTop: '1.5rem',
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  footerText: { fontSize: '0.8rem', color: '#475569', marginBottom: '0.75rem' },
  footerLinks: { display: 'flex', justifyContent: 'center', gap: '1rem' },
  linkBtn: {
    background: 'none', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8, padding: '0.5rem 1rem', fontSize: '0.85rem',
    fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
    transition: 'all 0.2s',
  },
};
