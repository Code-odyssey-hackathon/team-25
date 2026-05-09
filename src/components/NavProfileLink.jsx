import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function NavProfileLink() {
  const { user, loading, isAdmin, isEngineer, isLoggedIn } = useAuth();

  if (loading) return null;

  if (!isLoggedIn) {
    return (
      <Link href="/citizen/login" className="nav-item" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        👤 Login
      </Link>
    );
  }

  const initial = user?.email?.charAt(0).toUpperCase() || '?';
  const profileUrl = isAdmin ? '/admin/profile' : isEngineer ? '/engineer/dashboard' : '/citizen/profile';
  const label = isAdmin ? 'Admin' : isEngineer ? 'Engineer' : 'Profile';
  const gradientBg = isAdmin
    ? 'linear-gradient(135deg, #7c3aed, #a855f7)'
    : isEngineer
      ? 'linear-gradient(135deg, #0891b2, #06b6d4)'
      : 'linear-gradient(135deg, #3b82f6, #8b5cf6)';

  return (
    <Link href={profileUrl} className="nav-item" style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      padding: '0.35rem 0.75rem', borderRadius: 20,
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.1)',
      transition: 'all 0.3s ease',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: gradientBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.75rem', fontWeight: 800, color: '#fff',
        flexShrink: 0,
      }}>
        {initial}
      </div>
      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
        {label}
      </span>
    </Link>
  );
}

