'use client';
import dynamic from 'next/dynamic';
const BridgeDetail = dynamic(() => import('@/views/BridgeDetail'), { ssr: false });
export default function BridgeDetailPage() {
  return <BridgeDetail />;
}
