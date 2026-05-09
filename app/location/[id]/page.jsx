'use client';
import dynamic from 'next/dynamic';
const LocationDetail = dynamic(() => import('@/views/LocationDetail'), { ssr: false });
export default function LocationDetailPage() {
  return <LocationDetail />;
}
