'use client';
import dynamic from 'next/dynamic';
const ReportIssue = dynamic(() => import('@/views/ReportIssue'), { ssr: false });
export default function ReportPage() {
  return <ReportIssue />;
}
