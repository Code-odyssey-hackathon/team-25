'use client';
import ProtectedRoute from '@/components/ProtectedRoute';
import dynamic from 'next/dynamic';
const AdminAnalytics = dynamic(() => import('@/views/admin/Analytics'), { ssr: false });
export default function AdminAnalyticsPage() {
  return (
    <ProtectedRoute>
      <AdminAnalytics />
    </ProtectedRoute>
  );
}
