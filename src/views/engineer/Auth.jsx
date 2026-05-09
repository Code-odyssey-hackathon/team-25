/**
 * JanaVaani — Engineer Login
 * 
 * Persona: Technical, field-focused, industrial.
 * Brand: Steel blue/cyan, grid patterns, technical iconography.
 * For: PWD Field Engineers, Inspection Officers, Maintenance Crew.
 */
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInEngineer } from '../../lib/auth';
import { useAuth } from '../../context/AuthContext';

export default function EngineerAuth() {
  const router = useRouter();
  const { user, engineer, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
  const lastRequest = useRef(0);

  useEffect(() => {
    if (!authLoading && user && engineer) {
      router.push('/engineer/dashboard');
    }
  }, [user, engineer, authLoading, router]);

  async function handleLogin(e) {
    e.preventDefault();
    setError(null);
    const now = Date.now();
    if (now - lastRequest.current < 3000) {
      setError('Please wait a few seconds before trying again.');
      return;
    }
    setLoading(true);
    lastRequest.current = now;
    try {
      await signInEngineer(email, password);
      router.push('/engineer/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return <div style={styles.pageWrap}><div className="spinner" /></div>;
  }

  return (
    <div style={styles.pageWrap}>
      {/* Background effects */}
      <div style={styles.bgGrid} />
      <div style={styles.bgOrb1} />
      <div style={styles.bgOrb2} />
      <div style={styles.bgScanline} />

      <div style={styles.contentWrap}>
        {/* Left — Field Engineer Branding */}
        <div style={styles.brandPanel}>
          <div style={styles.brandContent}>
            <div style={styles.toolIcon}>
              <span style={styles.toolEmoji}>🔧</span>
              <div style={styles.toolPulse} />
            </div>
            <div style={styles.deptBadge}>PUBLIC WORKS DEPARTMENT</div>
            <h2 style={styles.brandTitle}>Field Engineer Portal</h2>
            <p style={styles.brandSub}>
              Access assigned tasks, log field actions, and update inspection reports in real-time.
            </p>
            <div style={styles.divider} />
            
            {/* Field Protocol */}
            <div style={styles.protocolBox}>
              <div style={styles.protocolTitle}>📋 K-GRM Action Protocol</div>
              <div style={styles.protocolSteps}>
                <div style={styles.step}>
                  <div style={{...styles.stepNum, background: 'rgba(59,130,246,0.2)', color: '#60a5fa'}}>1</div>
                  <div style={styles.stepText}>Field Visit Initiated</div>
                </div>
                <div style={styles.stepConnector} />
                <div style={styles.step}>
                  <div style={{...styles.stepNum, background: 'rgba(139,92,246,0.2)', color: '#a78bfa'}}>2</div>
                  <div style={styles.stepText}>Assessment & Documentation</div>
                </div>
                <div style={styles.stepConnector} />
                <div style={styles.step}>
                  <div style={{...styles.stepNum, background: 'rgba(245,158,11,0.2)', color: '#fbbf24'}}>3</div>
                  <div style={styles.stepText}>Material Request & Work</div>
                </div>
                <div style={styles.stepConnector} />
                <div style={styles.step}>
                  <div style={{...styles.stepNum, background: 'rgba(16,185,129,0.2)', color: '#34d399'}}>4</div>
                  <div style={styles.stepText}>Completion & Verification</div>
                </div>
              </div>
            </div>

            <div style={styles.specRow}>
              <div style={styles.specItem}>
                <div style={styles.specValue}>⚡</div>
                <div style={styles.specLabel}>Real-time Updates</div>
              </div>
              <div style={styles.specItem}>
                <div style={styles.specValue}>📸</div>
                <div style={styles.specLabel}>Photo Evidence</div>
              </div>
              <div style={styles.specItem}>
                <div style={styles.specValue}>📍</div>
                <div style={styles.specLabel}>GPS Tracking</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right — Login Form */}
        <div style={styles.formPanel}>
          <div style={styles.formCard}>
            <div style={styles.statusBar}>
              <div style={styles.statusDot} />
              <span style={styles.statusText}>SYSTEM ONLINE · ENCRYPTED</span>
            </div>

            <h1 style={styles.heading}>Engineer Sign In</h1>
            <p style={styles.subheading}>
              Enter your PWD credentials to access task management and field inspection tools.
            </p>

            <form onSubmit={handleLogin} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>EMPLOYEE EMAIL</label>
                <div style={{
                  ...styles.inputWrap,
                  ...(focusedField === 'email' ? styles.inputWrapFocused : {}),
                }}>
                  <span style={styles.inputIcon}>👷</span>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="engineer@pwd.karnataka.gov.in"
                    required
                    style={styles.input}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>ACCESS CODE</label>
                <div style={{
                  ...styles.inputWrap,
                  ...(focusedField === 'password' ? styles.inputWrapFocused : {}),
                }}>
                  <span style={styles.inputIcon}>🔐</span>
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

              {error && (
                <div style={styles.errorBox}>
                  <strong>Access Denied</strong>
                  <div style={{ marginTop: 4, opacity: 0.85 }}>⚠️ {error}</div>
                </div>
              )}

              <button type="submit" disabled={loading} style={styles.submitBtn}>
                {loading ? '⏳ Verifying...' : '→ Access Field Dashboard'}
              </button>
            </form>

            <div style={styles.footer}>
              <div style={styles.footerDivider}>
                <span style={styles.footerDividerLine} />
                <span style={styles.footerDividerText}>Switch Portal</span>
                <span style={styles.footerDividerLine} />
              </div>
              <div style={styles.footerLinks}>
                <Link href="/admin/login" style={styles.footerLink}>
                  🛡️ Authority Login
                </Link>
                <Link href="/citizen/login" style={styles.footerLink}>
                  👤 Citizen Portal
                </Link>
                <Link href="/" style={styles.footerLink}>
                  ← Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes engOrb1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, -15px) scale(1.08); }
        }
        @keyframes engOrb2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-15px, 20px) scale(1.1); }
        }
        @keyframes engGrid {
          0%, 100% { opacity: 0.04; }
          50% { opacity: 0.07; }
        }
        @keyframes engScanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes engPulse {
          0%, 100% { box-shadow: 0 0 4px rgba(6,182,212,0.4); }
          50% { box-shadow: 0 0 10px rgba(6,182,212,0.7); }
        }
      `}</style>
    </div>
  );
}

// ─── Engineer Brand: Steel Blue / Cyan / Industrial ───
const primary = '#0891b2';
const primaryLight = '#22d3ee';
const cyan = '#06b6d4';
const primaryDim = 'rgba(6,182,212,0.12)';
const primaryGlow = 'rgba(6,182,212,0.25)';

const styles = {
  pageWrap: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #0a1628 0%, #0d1117 40%, #0a1520 100%)',
    position: 'relative', overflow: 'hidden', padding: '2rem',
  },
  bgGrid: {
    position: 'absolute', inset: 0,
    backgroundImage: 'linear-gradient(rgba(6,182,212,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.04) 1px, transparent 1px)',
    backgroundSize: '30px 30px',
    animation: 'engGrid 4s ease-in-out infinite',
    pointerEvents: 'none',
  },
  bgOrb1: {
    position: 'absolute', width: 450, height: 450, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)',
    top: '-10%', left: '-5%', animation: 'engOrb1 9s ease-in-out infinite',
    pointerEvents: 'none',
  },
  bgOrb2: {
    position: 'absolute', width: 300, height: 300, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
    bottom: '5%', right: '5%', animation: 'engOrb2 11s ease-in-out infinite',
    pointerEvents: 'none',
  },
  bgScanline: {
    position: 'absolute', width: '100%', height: 2,
    background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.15), transparent)',
    animation: 'engScanline 6s linear infinite',
    pointerEvents: 'none',
  },
  contentWrap: {
    display: 'flex', maxWidth: 960, width: '100%', gap: 0,
    borderRadius: 20, overflow: 'hidden', position: 'relative', zIndex: 1,
    boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(6,182,212,0.1)',
  },
  brandPanel: {
    flex: '1 1 45%', padding: '3rem',
    background: 'linear-gradient(180deg, rgba(6,182,212,0.06) 0%, rgba(8,145,178,0.1) 50%, rgba(0,0,0,0.2) 100%)',
    borderRight: '1px solid rgba(6,182,212,0.1)',
    display: 'flex', flexDirection: 'column', justifyContent: 'center',
  },
  brandContent: {},
  toolIcon: {
    position: 'relative', width: 72, height: 72, marginBottom: '1.5rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  toolEmoji: { fontSize: '2.8rem', position: 'relative', zIndex: 2 },
  toolPulse: {
    position: 'absolute', inset: 0, borderRadius: '50%',
    border: `2px solid ${cyan}40`,
    animation: 'engPulse 2s ease-in-out infinite',
  },
  deptBadge: {
    display: 'inline-block', fontSize: '0.7rem', fontWeight: 700,
    color: primaryLight, letterSpacing: '0.15em', marginBottom: '0.5rem',
    background: primaryDim, padding: '0.3rem 0.8rem', borderRadius: 20,
    border: `1px solid ${primaryGlow}`,
  },
  brandTitle: {
    fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem',
    marginTop: '0.75rem',
  },
  brandSub: {
    fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.7, marginBottom: '1.5rem',
  },
  divider: {
    width: 60, height: 2,
    background: `linear-gradient(to right, ${cyan}, #3b82f6)`,
    marginBottom: '1.5rem', borderRadius: 2,
  },
  protocolBox: {
    background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(6,182,212,0.1)',
    borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem',
  },
  protocolTitle: {
    fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '1rem',
  },
  protocolSteps: {
    display: 'flex', flexDirection: 'column', gap: 0,
  },
  step: {
    display: 'flex', alignItems: 'center', gap: '0.6rem',
  },
  stepNum: {
    width: 24, height: 24, borderRadius: '50%', display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem',
    fontWeight: 800, flexShrink: 0,
  },
  stepText: { fontSize: '0.8rem', color: '#94a3b8' },
  stepConnector: {
    width: 2, height: 12, background: 'rgba(6,182,212,0.15)',
    marginLeft: 11,
  },
  specRow: {
    display: 'flex', gap: '1.5rem',
  },
  specItem: { textAlign: 'center' },
  specValue: { fontSize: '1.3rem' },
  specLabel: { fontSize: '0.7rem', color: '#64748b', marginTop: 4 },
  formPanel: {
    flex: '1 1 55%', padding: '3rem',
    background: 'rgba(15,23,42,0.97)',
    backdropFilter: 'blur(20px)',
  },
  formCard: {},
  statusBar: {
    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
    marginBottom: '1.5rem',
  },
  statusDot: {
    width: 8, height: 8, borderRadius: '50%', background: '#22c55e',
    boxShadow: '0 0 8px rgba(34,197,94,0.5)',
    animation: 'engPulse 2s ease-in-out infinite',
  },
  statusText: {
    fontSize: '0.7rem', fontWeight: 700, color: '#64748b',
    letterSpacing: '0.1em',
  },
  heading: {
    fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem',
  },
  subheading: {
    fontSize: '0.9rem', color: '#64748b', marginBottom: '2rem', lineHeight: 1.5,
  },
  form: { display: 'flex', flexDirection: 'column', gap: '1.2rem' },
  inputGroup: {},
  label: {
    display: 'block', fontSize: '0.75rem', fontWeight: 700,
    color: '#94a3b8', marginBottom: '0.4rem',
    letterSpacing: '0.1em',
  },
  inputWrap: {
    display: 'flex', alignItems: 'center', gap: '0.6rem',
    background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10, padding: '0 1rem', transition: 'all 0.2s ease',
  },
  inputWrapFocused: {
    borderColor: cyan, boxShadow: `0 0 0 3px ${primaryDim}`,
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
    borderRadius: 10, padding: '0.85rem 1rem', color: '#fca5a5', fontSize: '0.85rem',
  },
  submitBtn: {
    width: '100%', padding: '0.9rem', border: 'none', borderRadius: 10,
    background: `linear-gradient(135deg, ${primary}, #0e7490)`,
    color: '#fff', fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
    transition: 'all 0.2s ease', marginTop: '0.5rem',
    boxShadow: `0 4px 16px rgba(6,182,212,0.25)`,
  },
  footer: { marginTop: '2rem', paddingTop: '1.5rem' },
  footerDivider: {
    display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem',
  },
  footerDividerLine: {
    flex: 1, height: 1, background: 'rgba(255,255,255,0.06)',
  },
  footerDividerText: {
    fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  footerLinks: {
    display: 'flex', justifyContent: 'center', gap: '1.5rem',
  },
  footerLink: {
    fontSize: '0.8rem', color: '#64748b', textDecoration: 'none',
    transition: 'color 0.2s',
  },
};
