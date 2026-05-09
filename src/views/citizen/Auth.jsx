/**
 * JanaVaani — Citizen Login / Sign Up
 * 
 * Persona: Community-focused, warm, accessible.
 * Brand: Teal/emerald gradient, friendly iconography, civic empowerment messaging.
 * Citizens create accounts to submit verified civic infrastructure reports.
 */
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function CitizenAuth() {
  const router = useRouter();
  const { loading: authLoading, isLoggedIn, user } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [focusedField, setFocusedField] = useState(null);

  const lastRequestTime = useRef(0);
  const MIN_REQUEST_INTERVAL = 3000;

  useEffect(() => {
    if (isLoggedIn && user && !authLoading) {
      router.push('/report');
    }
  }, [isLoggedIn, user, authLoading, router]);

  if (authLoading) {
    return (
      <div style={styles.pageWrap}>
        <div className="spinner" />
      </div>
    );
  }

  if (isLoggedIn && user) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const now = Date.now();
    if (now - lastRequestTime.current < MIN_REQUEST_INTERVAL) {
      setError('Please wait a few seconds before trying again.');
      return;
    }

    if (mode === 'signup') {
      if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
      if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    }

    setLoading(true);
    lastRequestTime.current = now;

    try {
      if (mode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        router.push('/report');
      } else {
        const redirectUrl = process.env.NODE_ENV === 'production'
          ? 'https://JanaVaani-six.vercel.app/report'
          : `${window.location.origin}/report`;
        const { error: signUpError } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: redirectUrl },
        });
        if (signUpError) throw signUpError;
        setSuccess('Account created! Check your email to verify, then login to submit reports.');
        setMode('login');
        setPassword('');
      }
    } catch (err) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.pageWrap}>
      {/* Animated Background Elements */}
      <div style={styles.bgOrb1} />
      <div style={styles.bgOrb2} />
      <div style={styles.bgOrb3} />
      <div style={styles.bgGrid} />

      <div style={styles.contentWrap}>
        {/* Left Branding Panel */}
        <div style={styles.brandPanel}>
          <div style={styles.brandContent}>
            <div style={styles.brandIcon}>🏘️</div>
            <h2 style={styles.brandTitle}>Your Voice Matters</h2>
            <p style={styles.brandSubtitle}>
              Join thousands of citizens building a better Karnataka. Report infrastructure issues, 
              track resolutions, and hold authorities accountable.
            </p>
            <div style={styles.statsRow}>
              <div style={styles.statItem}>
                <div style={styles.statNumber}>31</div>
                <div style={styles.statLabel}>Districts</div>
              </div>
              <div style={styles.statItem}>
                <div style={styles.statNumber}>24/7</div>
                <div style={styles.statLabel}>Active</div>
              </div>
              <div style={styles.statItem}>
                <div style={styles.statNumber}>4hr</div>
                <div style={styles.statLabel}>SLA</div>
              </div>
            </div>
            <div style={styles.featureList}>
              <div style={styles.featureItem}>📸 <span>Photo-verified reports</span></div>
              <div style={styles.featureItem}>📍 <span>GPS geotagged locations</span></div>
              <div style={styles.featureItem}>⏱️ <span>K-GRM escalation protection</span></div>
              <div style={styles.featureItem}>🏆 <span>Civic Hero rewards program</span></div>
            </div>
          </div>
        </div>

        {/* Right Auth Form */}
        <div style={styles.formPanel}>
          <div style={styles.formCard}>
            {/* Logo */}
            <div style={styles.logoRow}>
              <span style={styles.logoIcon}>👤</span>
              <div>
                <div style={styles.logoTitle}>JanaVaani</div>
                <div style={styles.logoSub}>Citizen Portal</div>
              </div>
            </div>

            <h1 style={styles.heading}>{mode === 'login' ? 'Welcome Back' : 'Join the Movement'}</h1>
            <p style={styles.subheading}>
              {mode === 'login'
                ? 'Sign in to submit and track your civic reports.'
                : 'Create your citizen account to start making change.'}
            </p>

            {/* Mode Switcher */}
            <div style={styles.modeSwitcher}>
              <button
                style={{
                  ...styles.modeBtn,
                  ...(mode === 'login' ? styles.modeBtnActive : {}),
                }}
                onClick={() => setMode('login')}
              >
                Sign In
              </button>
              <button
                style={{
                  ...styles.modeBtn,
                  ...(mode === 'signup' ? styles.modeBtnActive : {}),
                }}
                onClick={() => setMode('signup')}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Email Address</label>
                <div style={{
                  ...styles.inputWrap,
                  ...(focusedField === 'email' ? styles.inputWrapFocused : {}),
                }}>
                  <span style={styles.inputIcon}>✉️</span>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="you@email.com"
                    required
                    style={styles.input}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Password</label>
                <div style={{
                  ...styles.inputWrap,
                  ...(focusedField === 'password' ? styles.inputWrapFocused : {}),
                }}>
                  <span style={styles.inputIcon}>🔑</span>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="••••••••"
                    required
                    style={styles.input}
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {mode === 'signup' && (
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Confirm Password</label>
                  <div style={{
                    ...styles.inputWrap,
                    ...(focusedField === 'confirm' ? styles.inputWrapFocused : {}),
                  }}>
                    <span style={styles.inputIcon}>🔒</span>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      onFocus={() => setFocusedField('confirm')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="••••••••"
                      required
                      style={styles.input}
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              )}

              {error && <div style={styles.errorBox}>⚠️ {error}</div>}
              {success && <div style={styles.successBox}>✅ {success}</div>}

              <button type="submit" disabled={loading} style={styles.submitBtn}>
                {loading ? '⏳ Processing...' : mode === 'login' ? '→ Sign In' : '→ Create Account'}
              </button>
            </form>

            {/* Footer links */}
            <div style={styles.footer}>
              <p style={styles.footerText}>
                Government authority?{' '}
                <Link href="/admin/login" style={styles.footerLink}>Admin Login →</Link>
              </p>
              <p style={styles.footerText}>
                Field engineer?{' '}
                <Link href="/engineer/login" style={styles.footerLink}>Engineer Portal →</Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes citizenOrb1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -20px) scale(1.1); }
        }
        @keyframes citizenOrb2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-20px, 30px) scale(1.15); }
        }
        @keyframes citizenOrb3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(15px, 15px) scale(1.05); }
        }
        @keyframes citizenPulse {
          0%, 100% { opacity: 0.03; }
          50% { opacity: 0.06; }
        }
      `}</style>
    </div>
  );
}

// ─── Citizen Brand: Teal / Emerald / Warm ───
const accent = '#10b981';
const accentLight = '#34d399';
const accentDim = 'rgba(16,185,129,0.15)';
const accentGlow = 'rgba(16,185,129,0.3)';

const styles = {
  pageWrap: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0a0f1a 0%, #0d1117 40%, #091a16 100%)',
    position: 'relative',
    overflow: 'hidden',
    padding: '2rem',
  },
  bgOrb1: {
    position: 'absolute', width: 400, height: 400, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)',
    top: '-10%', right: '10%', animation: 'citizenOrb1 8s ease-in-out infinite',
    pointerEvents: 'none',
  },
  bgOrb2: {
    position: 'absolute', width: 300, height: 300, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)',
    bottom: '5%', left: '5%', animation: 'citizenOrb2 10s ease-in-out infinite',
    pointerEvents: 'none',
  },
  bgOrb3: {
    position: 'absolute', width: 200, height: 200, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)',
    top: '40%', left: '30%', animation: 'citizenOrb3 12s ease-in-out infinite',
    pointerEvents: 'none',
  },
  bgGrid: {
    position: 'absolute', inset: 0,
    backgroundImage: 'linear-gradient(rgba(16,185,129,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.03) 1px, transparent 1px)',
    backgroundSize: '40px 40px',
    animation: 'citizenPulse 4s ease-in-out infinite',
    pointerEvents: 'none',
  },
  contentWrap: {
    display: 'flex', maxWidth: 960, width: '100%', gap: '0',
    borderRadius: 20, overflow: 'hidden', position: 'relative', zIndex: 1,
    boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(16,185,129,0.1)',
  },
  brandPanel: {
    flex: '1 1 45%', padding: '3rem',
    background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(6,95,70,0.2) 100%)',
    borderRight: '1px solid rgba(16,185,129,0.15)',
    display: 'flex', flexDirection: 'column', justifyContent: 'center',
  },
  brandContent: { },
  brandIcon: { fontSize: '3.5rem', marginBottom: '1.5rem', display: 'block' },
  brandTitle: {
    fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginBottom: '0.75rem',
    lineHeight: 1.2,
  },
  brandSubtitle: {
    fontSize: '0.95rem', color: '#94a3b8', lineHeight: 1.7, marginBottom: '2rem',
  },
  statsRow: {
    display: 'flex', gap: '1.5rem', marginBottom: '2rem',
  },
  statItem: { textAlign: 'center' },
  statNumber: { fontSize: '1.5rem', fontWeight: 800, color: accentLight },
  statLabel: { fontSize: '0.75rem', color: '#64748b', marginTop: 2 },
  featureList: { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  featureItem: {
    display: 'flex', alignItems: 'center', gap: '0.6rem',
    fontSize: '0.85rem', color: '#94a3b8',
  },
  formPanel: {
    flex: '1 1 55%', padding: '3rem',
    background: 'rgba(15,23,42,0.95)',
    backdropFilter: 'blur(20px)',
  },
  formCard: {},
  logoRow: {
    display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem',
  },
  logoIcon: {
    fontSize: '2rem', width: 48, height: 48, borderRadius: 12,
    background: accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: `1px solid ${accentGlow}`,
  },
  logoTitle: { fontSize: '1.1rem', fontWeight: 800, color: '#fff' },
  logoSub: { fontSize: '0.75rem', color: accent, fontWeight: 600 },
  heading: {
    fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem',
  },
  subheading: {
    fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.5,
  },
  modeSwitcher: {
    display: 'flex', background: 'rgba(0,0,0,0.4)', borderRadius: 10, padding: 4,
    marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.05)',
  },
  modeBtn: {
    flex: 1, padding: '0.6rem', border: 'none', borderRadius: 8,
    background: 'transparent', color: '#64748b', fontSize: '0.9rem',
    fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease',
  },
  modeBtnActive: {
    background: accent, color: '#fff',
    boxShadow: `0 4px 12px rgba(16,185,129,0.3)`,
  },
  form: { display: 'flex', flexDirection: 'column', gap: '1.1rem' },
  inputGroup: {},
  label: {
    display: 'block', fontSize: '0.8rem', fontWeight: 600,
    color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  inputWrap: {
    display: 'flex', alignItems: 'center', gap: '0.6rem',
    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10, padding: '0 1rem', transition: 'all 0.2s ease',
  },
  inputWrapFocused: {
    borderColor: accent, boxShadow: `0 0 0 3px ${accentDim}`,
    background: 'rgba(0,0,0,0.5)',
  },
  inputIcon: { fontSize: '1rem', opacity: 0.6 },
  input: {
    flex: 1, border: 'none', background: 'transparent', color: '#fff',
    padding: '0.85rem 0', fontSize: '0.95rem', outline: 'none',
    fontFamily: 'inherit',
  },
  errorBox: {
    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 10, padding: '0.8rem 1rem', color: '#fca5a5', fontSize: '0.85rem',
  },
  successBox: {
    background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
    borderRadius: 10, padding: '0.8rem 1rem', color: '#6ee7b7', fontSize: '0.85rem',
  },
  submitBtn: {
    width: '100%', padding: '0.9rem', border: 'none', borderRadius: 10,
    background: `linear-gradient(135deg, ${accent}, #059669)`,
    color: '#fff', fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
    transition: 'all 0.2s ease', marginTop: '0.5rem',
    boxShadow: `0 4px 16px rgba(16,185,129,0.25)`,
  },
  footer: {
    marginTop: '2rem', paddingTop: '1.5rem',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    display: 'flex', flexDirection: 'column', gap: '0.5rem',
  },
  footerText: { fontSize: '0.8rem', color: '#475569', margin: 0 },
  footerLink: { color: accent, fontWeight: 600, textDecoration: 'none' },
};