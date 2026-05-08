'use client';
import ProtectedRoute from '@/components/ProtectedRoute';
import dynamic from 'next/dynamic';
const AdminDashboard = dynamic(() => import('@/views/admin/Dashboard'), { ssr: false });
export default function AdminDashboardPage() {
  return (
    <ProtectedRoute>
      <AdminDashboard />
    </ProtectedRoute>
  );
}
