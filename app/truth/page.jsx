'use client';
import dynamic from 'next/dynamic';
const TruthDashboard = dynamic(() => import('@/views/TruthDashboard'), { ssr: false });
export default function TruthPage() {
  return <TruthDashboard />;
}
