'use client';
import dynamic from 'next/dynamic';
const ReportBridge = dynamic(() => import('@/views/ReportBridge'), { ssr: false });
export default function ReportBridgePage() {
  return <ReportBridge />;
}
