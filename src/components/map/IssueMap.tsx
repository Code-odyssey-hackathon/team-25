"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Dynamic import to avoid SSR issues with Leaflet
const MapInner = dynamic(() => import("./MapInner"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-muted/30 rounded-xl">
      <Skeleton className="w-full h-full rounded-xl" />
    </div>
  ),
});

export { MapInner as IssueMap };
