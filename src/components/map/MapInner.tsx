"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet.markercluster";
import { MAP_DEFAULTS, CATEGORY_CONFIG } from "@/lib/constants";
import type { Report, IssueCategory } from "@/types";

// Fix Leaflet default icon issue in Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface MapInnerProps {
  reports: Report[];
  onMarkerClick?: (report: Report) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
}

function createCategoryIcon(category: IssueCategory) {
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other;
  return L.divIcon({
    html: `<div style="background:${config.markerColor};width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);cursor:pointer;">${config.emoji}</div>`,
    className: "custom-marker",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -34],
  });
}

export default function MapInner({
  reports,
  onMarkerClick,
  center = MAP_DEFAULTS.center,
  zoom = MAP_DEFAULTS.zoom,
  className = "",
}: MapInnerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [center.lat, center.lng],
      zoom,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer(MAP_DEFAULTS.tileUrl, {
      maxZoom: MAP_DEFAULTS.maxZoom,
      attribution: MAP_DEFAULTS.tileAttribution,
    }).addTo(map);

    L.control.zoom({ position: "topright" }).addTo(map);
    L.control.attribution({ position: "bottomright" }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [center.lat, center.lng, zoom]);

  // Update markers when reports change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing cluster group
    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
    }

    // Create new cluster group with custom styling
    const cluster = L.markerClusterGroup({
      maxClusterRadius: MAP_DEFAULTS.clusterRadius,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      iconCreateFunction: (c) => {
        const count = c.getChildCount();
        const size = count < 10 ? "small" : count < 50 ? "medium" : "large";
        const sizes = { small: 40, medium: 50, large: 60 };
        const colors = { small: "#6366f1", medium: "#f59e0b", large: "#ef4444" };
        return L.divIcon({
          html: `<div style="background:${colors[size]};width:${sizes[size]}px;height:${sizes[size]}px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:14px;border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.3);">${count}</div>`,
          className: "custom-cluster",
          iconSize: [sizes[size], sizes[size]],
        });
      },
    });

    // Add markers
    reports.forEach((report) => {
      if (!report.latitude || !report.longitude) return;

      const marker = L.marker([report.latitude, report.longitude], {
        icon: createCategoryIcon(report.category),
      });

      // Popup
      marker.bindPopup(
        `<div style="min-width:180px;"><strong style="font-size:13px;">${report.title}</strong><br/><span style="font-size:11px;opacity:0.7;">${CATEGORY_CONFIG[report.category]?.label || "Other"} • Priority: ${report.priority_score}</span></div>`,
        { closeButton: false, className: "custom-popup" }
      );

      if (onMarkerClick) {
        marker.on("click", () => onMarkerClick(report));
      }

      cluster.addLayer(marker);
    });

    map.addLayer(cluster);
    clusterRef.current = cluster;

    // Fit bounds if we have markers
    if (reports.length > 0) {
      const bounds = cluster.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [reports, onMarkerClick]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full min-h-[400px] rounded-xl overflow-hidden ${className}`}
      style={{ zIndex: 0 }}
    />
  );
}
