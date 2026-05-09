'use client';
import dynamic from 'next/dynamic';
import ProtectedRoute from '@/components/ProtectedRoute';

const MasterTickets = dynamic(() => import('@/views/admin/MasterTickets'), { ssr: false });

export default function MasterTicketsPage() {
  return (
    <ProtectedRoute>
      <MasterTickets />
    </ProtectedRoute>
  );
}
