/**
 * JanaVaani — Main Portal
 * 
 * Entry point for the platform. Three distinct personas with matching branding.
 * Each card routes to its dedicated, persona-specific login interface.
 */
import { useRouter } from 'next/navigation';

export default function Portal() {
  const router = useRouter();

  const personas = [
    {
      id: 'citizen',
      icon: '👁️',
      title: 'Citizen Access',
      subtitle: 'Report · Track · Hold Accountable',
      description: 'Report dangerous infrastructure, track resolution progress, and earn Civic Hero rewards. No login needed to browse.',
      route: '/citizen/login',
      publicRoute: '/map',
      btnLabel: 'Citizen Login →',
      publicLabel: 'Browse Public Map →',
      accent: '#10b981',
      accentDim: 'rgba(16,185,129,0.12)',
      borderColor: 'rgba(16,185,129,0.2)',
      bgGrad: 'linear-gradient(180deg, rgba(16,185,129,0.06) 0%, rgba(0,0,0,0) 100%)',
      glow: 'rgba(16,185,129,0.15)',
    },
    {
      id: 'admin',
      icon: '🛡️',
      title: 'Authority Login',
      subtitle: 'Municipal · DC · State Ministry',
      description: 'K-GRM Dashboard for PWD, HDMC, DC offices, and State Welfare Ministry officials. Review reports and enforce SLA.',
      route: '/admin/login',
      btnLabel: 'Admin Login →',
      accent: '#ef4444',
      accentDim: 'rgba(239,68,68,0.12)',
      borderColor: 'rgba(239,68,68,0.2)',
      bgGrad: 'linear-gradient(180deg, rgba(239,68,68,0.06) 0%, rgba(0,0,0,0) 100%)',
      glow: 'rgba(239,68,68,0.15)',
    },
    {
      id: 'engineer',
      icon: '🔧',
      title: 'Engineer Portal',
      subtitle: 'Field Inspections · Task Management',
      description: 'Access assigned tasks, log field actions with photo evidence, and update inspection status in real-time.',
      route: '/engineer/login',
      btnLabel: 'Engineer Login →',
      accent: '#06b6d4',
      accentDim: 'rgba(6,182,212,0.12)',
      borderColor: 'rgba(6,182,212,0.2)',
      bgGrad: 'linear-gradient(180deg, rgba(6,182,212,0.06) 0%, rgba(0,0,0,0) 100%)',
      glow: 'rgba(6,182,212,0.15)',
    },
  ];

  return (
    <div style={styles.pageWrap}>
      {/* Background effects */}
      <div style={styles.bgOrb1} />
      <div style={styles.bgOrb2} />
      <div style={styles.bgGrid} />

      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logoArea}>
            <span style={styles.logoEmoji}>📋</span>
          </div>
          <h1 style={styles.title}>JanaVaani</h1>
          <div style={styles.tagline}>Karnataka Grievance Redressal & Management System</div>
          <p style={styles.subtitle}>
            India's citizen-driven civic accountability network. 
            31 districts · 4-hour SLA · AI-powered classification.
          </p>
        </div>

        {/* Persona Cards */}
        <div style={styles.cardsGrid}>
          {personas.map((p) => (
            <div
              key={p.id}
              style={{
                ...styles.card,
                borderColor: p.borderColor,
                background: p.bgGrad,
              }}
              onClick={() => router.push(p.route)}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.borderColor = p.accent + '60';
                e.currentTarget.style.boxShadow = `0 15px 40px ${p.glow}`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = p.borderColor;
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ ...styles.cardIcon, background: p.accentDim }}>{p.icon}</div>
              <h2 style={{ ...styles.cardTitle, color: p.accent === '#ef4444' ? '#fca5a5' : (p.accent === '#06b6d4' ? '#67e8f9' : '#6ee7b7') }}>
                {p.title}
              </h2>
              <div style={{ ...styles.cardSubtitle, color: p.accent + 'aa' }}>{p.subtitle}</div>
              <p style={styles.cardDesc}>{p.description}</p>
              <button
                style={{
                  ...styles.cardBtn,
                  background: p.accentDim,
                  color: p.accent,
                  borderColor: p.accent + '30',
                }}
              >
                {p.btnLabel}
              </button>
              {p.publicRoute && (
                <button
                  style={styles.publicBtn}
                  onClick={(e) => { e.stopPropagation(); router.push(p.publicRoute); }}
                >
                  {p.publicLabel}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <div style={styles.footerLinks}>
            <button style={styles.footerLink} onClick={() => router.push('/feed')}>📰 Public Reports</button>
            <button style={styles.footerLink} onClick={() => router.push('/leaderboard')}>🏆 Leaderboard</button>
            <button style={styles.footerLink} onClick={() => router.push('/map')}>🗺️ Live Map</button>
          </div>
          <div style={styles.footerCredits}>
            K-GRM · Directorate of Municipal Administration, Karnataka · dma.karnataka.gov.in
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes portalOrb1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(25px, -15px) scale(1.1); }
        }
        @keyframes portalOrb2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-20px, 20px) scale(1.08); }
        }
        @keyframes portalGrid {
          0%, 100% { opacity: 0.025; }
          50% { opacity: 0.05; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  pageWrap: {
    minHeight: '100vh',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(180deg, #0a0f1a 0%, #0d1117 50%, #0f172a 100%)',
    position: 'relative', overflow: 'hidden', padding: '2rem',
  },
  bgOrb1: {
    position: 'absolute', width: 500, height: 500, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
    top: '-10%', right: '5%', animation: 'portalOrb1 10s ease-in-out infinite',
    pointerEvents: 'none',
  },
  bgOrb2: {
    position: 'absolute', width: 400, height: 400, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)',
    bottom: '-5%', left: '10%', animation: 'portalOrb2 12s ease-in-out infinite',
    pointerEvents: 'none',
  },
  bgGrid: {
    position: 'absolute', inset: 0,
    backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
    backgroundSize: '50px 50px',
    animation: 'portalGrid 5s ease-in-out infinite',
    pointerEvents: 'none',
  },
  container: {
    maxWidth: 960, width: '100%', position: 'relative', zIndex: 1, textAlign: 'center',
  },
  header: { marginBottom: '3.5rem' },
  logoArea: {
    width: 72, height: 72, borderRadius: 18, margin: '0 auto 1.5rem',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
    border: '1px solid rgba(255,255,255,0.1)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
  },
  logoEmoji: { fontSize: '2.5rem' },
  title: {
    fontSize: '3.5rem', fontWeight: 900, marginBottom: '0.5rem',
    letterSpacing: '-1.5px',
    background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  tagline: {
    fontSize: '0.8rem', fontWeight: 600, color: '#64748b',
    letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem',
  },
  subtitle: {
    fontSize: '1.05rem', color: '#94a3b8', maxWidth: 550, margin: '0 auto',
    lineHeight: 1.6,
  },
  cardsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem',
    marginBottom: '3rem',
  },
  card: {
    padding: '2.5rem 2rem', borderRadius: 18, cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    borderWidth: 1, borderStyle: 'solid', textAlign: 'center',
    backdropFilter: 'blur(10px)',
  },
  cardIcon: {
    width: 64, height: 64, borderRadius: 16, fontSize: '2.2rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 1.25rem',
  },
  cardTitle: {
    fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.3rem',
  },
  cardSubtitle: {
    fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em',
    marginBottom: '1rem',
  },
  cardDesc: {
    fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '1.5rem',
  },
  cardBtn: {
    width: '100%', padding: '0.7rem 1.2rem',
    borderWidth: 1, borderStyle: 'solid',
    borderRadius: 10, fontSize: '0.95rem', fontWeight: 700,
    cursor: 'pointer', transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  },
  publicBtn: {
    width: '100%', padding: '0.5rem', marginTop: '0.5rem',
    background: 'transparent', border: 'none',
    color: '#64748b', fontSize: '0.8rem', cursor: 'pointer',
    fontFamily: 'inherit', transition: 'color 0.2s',
  },
  footer: { paddingTop: '1rem' },
  footerLinks: {
    display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1.5rem',
  },
  footerLink: {
    background: 'none', border: 'none', color: '#475569',
    fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit',
    transition: 'color 0.2s',
  },
  footerCredits: {
    fontSize: '0.7rem', color: '#334155', fontStyle: 'italic',
  },
};
