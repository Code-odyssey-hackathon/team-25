import { useAuth } from '../context/AuthContext';
import { redirect } from 'next/navigation';

export default function ProtectedRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="spinner"></div>
    </div>
  );
  if (!user) { redirect('/admin/login'); return null; }
  if (!isAdmin) { redirect('/'); return null; }
  return children;
}

/**
 * EngineerRoute — restricts access to authenticated engineers only.
 */
export function EngineerRoute({ children }) {
  const { user, isEngineer, loading } = useAuth();
  if (loading) return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="spinner"></div>
    </div>
  );
  if (!user) { redirect('/engineer/login'); return null; }
  if (!isEngineer) { redirect('/'); return null; }
  return children;
}
