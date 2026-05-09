/**
 * JanaVaani — Authority Login
 * 
 * Persona: Governmental, authoritative, premium.
 * Brand: Deep crimson/gold (Karnataka state colors), embossed seal, official language.
 * For: Municipal Officers, District Collectors, State Ministers.
 */
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '../../lib/auth';
import { useAuth } from '../../context/AuthContext';

export default function AdminLogin() {
  const router = useRouter();
  const { user, authority, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
  const lastRequestTime = useRef(0);

  useEffect(() => {
    if (!authLoading && user && authority) {
      router.push('/admin/dashboard');
    }
  }, [user, authority, authLoading, router]);

  async function handleLogin(e) {
    e.preventDefault();
    setError(null);
    const now = Date.now();
    if (now - lastRequestTime.current < 3000) {
      setError('Please wait a few seconds before trying again.');
      return;
    }
    setLoading(true);
    lastRequestTime.current = now;
    try {
      await signIn(email, password);
      router.push('/admin/dashboard');
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
      <div style={styles.bgSeal} />
      <div style={styles.bgOrb1} />
      <div style={styles.bgOrb2} />
      <div style={styles.bgStripes} />
      
      <div style={styles.contentWrap}>
        {/* Left — Official Branding */}
        <div style={styles.brandPanel}>
          <div style={styles.brandContent}>
            {/* Karnataka State Emblem Area */}
            <div style={styles.emblemWrap}>
              <div style={styles.emblem}>🏛️</div>
              <div style={styles.emblemRing} />
            </div>
            <div style={styles.govTitle}>Government of Karnataka</div>
            <div style={styles.deptTitle}>Directorate of Municipal Administration</div>
            <div style={styles.divider} />
            <h2 style={styles.brandTitle}>K-GRM Authority Portal</h2>
            <p style={styles.brandSub}>
              Karnataka Grievance Redressal & Management System. 
              Authorized access for government officials only.
            </p>
            <div style={styles.tierList}>
              <div style={styles.tierItem}>
                <div style={styles.tierDot1} />
                <div>
                  <div style={styles.tierLabel}>Municipal Corporation</div>
                  <div style={styles.tierDesc}>First response · 4hr SLA</div>
                </div>
              </div>
              <div style={styles.tierItem}>
                <div style={styles.tierDot2} />
                <div>
                  <div style={styles.tierLabel}>DC (Deputy Commissioner)</div>
                  <div style={styles.tierDesc}>Escalation oversight · District level</div>
                </div>
              </div>
              <div style={styles.tierItem}>
                <div style={styles.tierDot3} />
                <div>
                  <div style={styles.tierLabel}>State Welfare Ministry</div>
                  <div style={styles.tierDesc}>Final authority · Dr. H. C. Mahadevappa</div>
                </div>
              </div>
            </div>
            <div style={styles.legalText}>
              Ref: Directorate of Municipal Administration · dma.karnataka.gov.in
            </div>
          </div>
        </div>

        {/* Right — Login Form */}
        <div style={styles.formPanel}>
          <div style={styles.formCard}>
            <div style={styles.securityBadge}>
              <span style={styles.securityIcon}>🔐</span>
              <span style={styles.securityText}>SECURE GOVERNMENT ACCESS</span>
            </div>

            <h1 style={styles.heading}>Authority Sign In</h1>
            <p style={styles.subheading}>
              Enter your official credentials to access the K-GRM administrative dashboard.
            </p>

            <form onSubmit={handleLogin} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>OFFICIAL EMAIL</label>
                <div style={{
                  ...styles.inputWrap,
                  ...(focusedField === 'email' ? styles.inputWrapFocused : {}),
                }}>
                  <span style={styles.inputIcon}>📧</span>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="officer@karnataka.gov.in"
                    required
                    style={styles.input}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>PASSWORD</label>
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

              {error && (
                <div style={styles.errorBox}>
                  <strong>Authentication Failed</strong>
                  <div style={{ marginTop: 4, opacity: 0.85 }}>⚠️ {error}</div>
                </div>
              )}

              <button type="submit" disabled={loading} style={styles.submitBtn}>
                {loading ? '⏳ Authenticating...' : '→ Sign In to Dashboard'}
              </button>
            </form>

            <div style={styles.footer}>
              <div style={styles.footerDivider}>
                <span style={styles.footerDividerLine} />
                <span style={styles.footerDividerText}>Other portals</span>
                <span style={styles.footerDividerLine} />
              </div>
              <div style={styles.footerLinks}>
                <Link href="/citizen/login" style={styles.footerLink}>
                  👤 Citizen Portal
                </Link>
                <Link href="/engineer/login" style={styles.footerLink}>
                  🔧 Engineer Portal
                </Link>
                <Link href="/" style={styles.footerLink}>
                  ← Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes adminOrb1 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.12; }
          50% { transform: translate(-20px, 10px) scale(1.1); opacity: 0.18; }
        }
        @keyframes adminOrb2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(15px, -25px) scale(1.05); }
        }
        @keyframes adminSealSpin {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes adminStripes {
          0%, 100% { opacity: 0.02; }
          50% { opacity: 0.04; }
        }
      `}</style>
    </div>
  );
}

// ─── Admin Brand: Crimson / Gold / Official ───
const primary = '#dc2626';
const primaryLight = '#f87171';
const gold = '#fbbf24';
const primaryDim = 'rgba(220,38,38,0.12)';
const primaryGlow = 'rgba(220,38,38,0.25)';

const styles = {
  pageWrap: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #1a0a0a 0%, #0d1117 40%, #1a0f0a 100%)',
    position: 'relative', overflow: 'hidden', padding: '2rem',
  },
  bgSeal: {
    position: 'absolute', width: 600, height: 600,
    border: '1px solid rgba(220,38,38,0.06)', borderRadius: '50%',
    top: '50%', left: '25%',
    animation: 'adminSealSpin 60s linear infinite',
    pointerEvents: 'none',
  },
  bgOrb1: {
    position: 'absolute', width: 500, height: 500, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(220,38,38,0.1) 0%, transparent 70%)',
    top: '-15%', right: '-5%', animation: 'adminOrb1 8s ease-in-out infinite',
    pointerEvents: 'none',
  },
  bgOrb2: {
    position: 'absolute', width: 350, height: 350, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(251,191,36,0.06) 0%, transparent 70%)',
    bottom: '-10%', left: '10%', animation: 'adminOrb2 12s ease-in-out infinite',
    pointerEvents: 'none',
  },
  bgStripes: {
    position: 'absolute', inset: 0,
    backgroundImage: 'repeating-linear-gradient(135deg, rgba(220,38,38,0.015) 0px, rgba(220,38,38,0.015) 1px, transparent 1px, transparent 60px)',
    animation: 'adminStripes 5s ease-in-out infinite',
    pointerEvents: 'none',
  },
  contentWrap: {
    display: 'flex', maxWidth: 960, width: '100%', gap: 0,
    borderRadius: 20, overflow: 'hidden', position: 'relative', zIndex: 1,
    boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(220,38,38,0.1)',
  },
  brandPanel: {
    flex: '1 1 45%', padding: '3rem',
    background: `linear-gradient(180deg, rgba(220,38,38,0.08) 0%, rgba(127,29,29,0.12) 50%, rgba(0,0,0,0.3) 100%)`,
    borderRight: '1px solid rgba(220,38,38,0.12)',
    display: 'flex', flexDirection: 'column', justifyContent: 'center',
  },
  brandContent: {},
  emblemWrap: {
    position: 'relative', width: 80, height: 80, marginBottom: '1.5rem',
  },
  emblem: {
    fontSize: '3rem', position: 'absolute', top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)', zIndex: 2,
  },
  emblemRing: {
    position: 'absolute', inset: 0, borderRadius: '50%',
    border: `2px solid ${gold}40`,
    boxShadow: `0 0 20px ${gold}10`,
  },
  govTitle: {
    fontSize: '0.75rem', fontWeight: 700, color: gold,
    textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.25rem',
  },
  deptTitle: {
    fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem',
  },
  divider: {
    width: 60, height: 2,
    background: `linear-gradient(to right, ${primary}, ${gold})`,
    marginBottom: '1.5rem', borderRadius: 2,
  },
  brandTitle: {
    fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '0.75rem',
  },
  brandSub: {
    fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.7, marginBottom: '2rem',
  },
  tierList: {
    display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '2rem',
  },
  tierItem: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
  },
  tierDot1: {
    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
    background: '#10b981', boxShadow: '0 0 8px rgba(16,185,129,0.5)',
  },
  tierDot2: {
    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
    background: '#3b82f6', boxShadow: '0 0 8px rgba(59,130,246,0.5)',
  },
  tierDot3: {
    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
    background: '#a855f7', boxShadow: '0 0 8px rgba(168,85,247,0.5)',
  },
  tierLabel: { fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' },
  tierDesc: { fontSize: '0.75rem', color: '#64748b' },
  legalText: {
    fontSize: '0.7rem', color: '#475569', fontStyle: 'italic',
  },
  formPanel: {
    flex: '1 1 55%', padding: '3rem',
    background: 'rgba(15,23,42,0.97)',
    backdropFilter: 'blur(20px)',
  },
  formCard: {},
  securityBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
    background: primaryDim, border: `1px solid ${primaryGlow}`,
    borderRadius: 20, padding: '0.35rem 1rem', marginBottom: '1.5rem',
  },
  securityIcon: { fontSize: '0.9rem' },
  securityText: {
    fontSize: '0.7rem', fontWeight: 700, color: primaryLight,
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
    border: `1px solid ${primary}`, boxShadow: `0 0 0 3px ${primaryDim}`,
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
    background: `linear-gradient(135deg, ${primary}, #991b1b)`,
    color: '#fff', fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
    transition: 'all 0.2s ease', marginTop: '0.5rem',
    boxShadow: `0 4px 16px rgba(220,38,38,0.25)`,
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
