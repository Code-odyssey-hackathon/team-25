'use client';
import { EngineerRoute } from '@/components/ProtectedRoute';
import EngineerDashboard from '@/views/engineer/Dashboard';
export default function EngineerDashboardPage() {
  return (
    <EngineerRoute>
      <EngineerDashboard />
    </EngineerRoute>
  );
}
