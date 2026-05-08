'use client';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminProfile from '@/views/admin/Profile';
export default function AdminProfilePage() {
  return (
    <ProtectedRoute>
      <AdminProfile />
    </ProtectedRoute>
  );
}
