/**
 * JanaVaani — Precision Geolocation Service
 *
 * Multi-source location detection with intelligent fallback:
 *   Priority 1: High-accuracy GPS (outdoor, satellite-based)
 *   Priority 2: Medium-accuracy Wi-Fi/Cell (indoor/urban)
 *   Priority 3: IP-based geolocation (last resort)
 *
 * Features:
 *   - Progressive accuracy refinement (coarse → fine)
 *   - Permission denial handling with clear user guidance
 *   - Timeout management with configurable thresholds
 *   - Karnataka district auto-detection from coordinates
 *   - Reverse geocoding via Nominatim (OpenStreetMap)
 *   - Battery-conscious: single-shot by default, watch mode opt-in
 *   - Continuous state updates via callback pattern
 */

import { KARNATAKA_DISTRICTS } from './karnatakaDistricts';

// ─── Configuration ────────────────────────────────────────────
const CONFIG = {
  // Phase 1: Fast coarse location (Wi-Fi/Cell)
  COARSE_TIMEOUT_MS: 5000,
  COARSE_MAX_AGE_MS: 60000,       // Accept cached position up to 60s old

  // Phase 2: High-accuracy GPS refinement
  FINE_TIMEOUT_MS: 12000,
  FINE_MAX_AGE_MS: 10000,         // Fresh GPS only

  // Reverse geocoding
  GEOCODE_TIMEOUT_MS: 6000,
  GEOCODE_DEBOUNCE_MS: 800,

  // IP fallback
  IP_TIMEOUT_MS: 5000,

  // Accuracy thresholds (meters)
  ACCURACY_EXCELLENT: 15,
  ACCURACY_GOOD: 50,
  ACCURACY_FAIR: 150,
  ACCURACY_POOR: 500,

  // Karnataka bounding box for sanity check
  KARNATAKA_BOUNDS: {
    minLat: 11.5,
    maxLat: 18.5,
    minLng: 74.0,
    maxLng: 78.6,
  },
};

// ─── Status Constants ─────────────────────────────────────────
export const GEO_STATUS = {
  IDLE: 'idle',
  REQUESTING: 'requesting',
  COARSE_ACQUIRED: 'coarse_acquired',
  REFINING: 'refining',
  ACQUIRED: 'acquired',
  IP_FALLBACK: 'ip_fallback',
  DENIED: 'denied',
  UNAVAILABLE: 'unavailable',
  TIMEOUT: 'timeout',
  ERROR: 'error',
};

// ─── Haversine Distance (meters) ──────────────────────────────
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Find Nearest Karnataka District ──────────────────────────
export function findNearestDistrict(lat, lng) {
  let nearest = null;
  let minDist = Infinity;

  for (const d of KARNATAKA_DISTRICTS) {
    const dist = haversineDistance(lat, lng, d.lat, d.lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = d;
    }
  }

  return nearest ? { ...nearest, distanceKm: Math.round(minDist / 100) / 10 } : null;
}

// ─── Check if Coordinates are in Karnataka ────────────────────
function isInKarnataka(lat, lng) {
  const b = CONFIG.KARNATAKA_BOUNDS;
  return lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng;
}

// ─── Accuracy Label ───────────────────────────────────────────
export function getAccuracyLabel(meters) {
  if (meters == null) return { label: 'Unknown', color: '#94a3b8', icon: '❓' };
  if (meters <= CONFIG.ACCURACY_EXCELLENT) return { label: 'Excellent', color: '#10b981', icon: '📍' };
  if (meters <= CONFIG.ACCURACY_GOOD) return { label: 'Good', color: '#34d399', icon: '📍' };
  if (meters <= CONFIG.ACCURACY_FAIR) return { label: 'Fair', color: '#f59e0b', icon: '📌' };
  if (meters <= CONFIG.ACCURACY_POOR) return { label: 'Approximate', color: '#f97316', icon: '📌' };
  return { label: 'Very Approximate', color: '#ef4444', icon: '🌐' };
}

// ─── Reverse Geocode via Nominatim ────────────────────────────
async function reverseGeocode(lat, lng) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CONFIG.GEOCODE_TIMEOUT_MS);

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: { 'Accept-Language': 'en' },
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);
    if (!res.ok) throw new Error(`Geocode HTTP ${res.status}`);

    const data = await res.json();
    const addr = data.address || {};

    return {
      displayName: data.display_name || '',
      locationName: data.name || addr.road || addr.amenity || addr.building || '',
      road: addr.road || addr.pedestrian || '',
      suburb: addr.suburb || addr.neighbourhood || addr.quarter || '',
      city: addr.city || addr.town || addr.village || addr.county || '',
      state: addr.state || '',
      pincode: addr.postcode || '',
      country: addr.country || '',
      raw: addr,
    };
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      console.warn('[Geo] Reverse geocode timed out');
    } else {
      console.warn('[Geo] Reverse geocode failed:', err.message);
    }
    return null;
  }
}

// ─── IP-Based Fallback ────────────────────────────────────────
async function ipGeolocation() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CONFIG.IP_TIMEOUT_MS);

  try {
    // Use ip-api.com (free, no key needed, 45 req/min)
    const res = await fetch('http://ip-api.com/json/?fields=lat,lon,city,regionName,zip,status', {
      signal: controller.signal,
    });

    clearTimeout(timeout);
    if (!res.ok) throw new Error(`IP API HTTP ${res.status}`);

    const data = await res.json();
    if (data.status !== 'success') throw new Error('IP geolocation failed');

    return {
      lat: data.lat,
      lng: data.lon,
      accuracy: 5000, // IP geolocation is ~5km accuracy
      city: data.city || '',
      state: data.regionName || '',
      pincode: data.zip || '',
      source: 'ip',
    };
  } catch (err) {
    clearTimeout(timeout);
    console.warn('[Geo] IP fallback failed:', err.message);
    return null;
  }
}

// ─── Browser Geolocation (Promisified) ────────────────────────
function getBrowserPosition(highAccuracy, timeoutMs, maxAgeMs) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
          speed: pos.coords.speed,
          heading: pos.coords.heading,
          timestamp: pos.timestamp,
          source: highAccuracy ? 'gps' : 'network',
        }),
      (err) => reject(err),
      {
        enableHighAccuracy: highAccuracy,
        timeout: timeoutMs,
        maximumAge: maxAgeMs,
      }
    );
  });
}

// ─── Main Geolocation Engine ──────────────────────────────────
/**
 * Detect user location with progressive accuracy refinement.
 *
 * @param {function} onUpdate - Callback receiving state updates:
 *   { status, lat, lng, accuracy, source, geocode, district, error, warning }
 * @returns {function} cancel - Call to abort the detection
 */
export function detectLocation(onUpdate) {
  let cancelled = false;

  const emit = (state) => {
    if (!cancelled) onUpdate(state);
  };

  (async () => {
    emit({ status: GEO_STATUS.REQUESTING });

    // ── Phase 1: Coarse location (network/Wi-Fi, fast) ────────
    let coarseResult = null;
    try {
      coarseResult = await getBrowserPosition(
        false,
        CONFIG.COARSE_TIMEOUT_MS,
        CONFIG.COARSE_MAX_AGE_MS
      );

      const district = findNearestDistrict(coarseResult.lat, coarseResult.lng);

      emit({
        status: GEO_STATUS.COARSE_ACQUIRED,
        lat: coarseResult.lat,
        lng: coarseResult.lng,
        accuracy: Math.round(coarseResult.accuracy),
        source: 'network',
        district,
        inKarnataka: isInKarnataka(coarseResult.lat, coarseResult.lng),
      });
    } catch (err) {
      // Phase 1 failed — check reason
      if (err.code === 1) {
        // PERMISSION_DENIED — try IP fallback
        emit({
          status: GEO_STATUS.DENIED,
          error: 'Location permission denied',
          guidance: 'Please enable location access in your browser settings, or enter your location manually.',
        });

        // Try IP as last resort
        const ipResult = await ipGeolocation();
        if (ipResult && !cancelled) {
          const district = findNearestDistrict(ipResult.lat, ipResult.lng);
          emit({
            status: GEO_STATUS.IP_FALLBACK,
            lat: ipResult.lat,
            lng: ipResult.lng,
            accuracy: ipResult.accuracy,
            source: 'ip',
            district,
            inKarnataka: isInKarnataka(ipResult.lat, ipResult.lng),
            city: ipResult.city,
            state: ipResult.state,
            pincode: ipResult.pincode,
            warning: 'Using approximate location from IP address (~5km accuracy). Enable GPS for better precision.',
          });

          // Reverse geocode IP result
          const geocode = await reverseGeocode(ipResult.lat, ipResult.lng);
          if (geocode && !cancelled) {
            emit({
              status: GEO_STATUS.IP_FALLBACK,
              lat: ipResult.lat,
              lng: ipResult.lng,
              accuracy: ipResult.accuracy,
              source: 'ip',
              district,
              geocode,
              inKarnataka: isInKarnataka(ipResult.lat, ipResult.lng),
              warning: 'Using approximate location from IP address.',
            });
          }
        }
        return;
      }

      // Other errors (timeout, unavailable) — continue to Phase 2
      console.warn('[Geo] Coarse location failed:', err.message);
    }

    if (cancelled) return;

    // ── Phase 2: High-accuracy GPS refinement ─────────────────
    emit({
      status: GEO_STATUS.REFINING,
      lat: coarseResult?.lat,
      lng: coarseResult?.lng,
      accuracy: coarseResult ? Math.round(coarseResult.accuracy) : null,
      source: 'refining_gps',
    });

    let fineResult = null;
    try {
      fineResult = await getBrowserPosition(
        true,
        CONFIG.FINE_TIMEOUT_MS,
        CONFIG.FINE_MAX_AGE_MS
      );
    } catch (err) {
      console.warn('[Geo] Fine GPS failed:', err.message);
      // Use coarse result if GPS refinement fails
      if (err.code === 3 && coarseResult) {
        fineResult = coarseResult; // Timeout — use coarse
      }
    }

    if (cancelled) return;

    // ── Choose best result ────────────────────────────────────
    const best = fineResult || coarseResult;

    if (!best) {
      // Both phases failed — try IP
      const ipResult = await ipGeolocation();
      if (ipResult && !cancelled) {
        const district = findNearestDistrict(ipResult.lat, ipResult.lng);
        const geocode = await reverseGeocode(ipResult.lat, ipResult.lng);
        emit({
          status: GEO_STATUS.IP_FALLBACK,
          lat: ipResult.lat,
          lng: ipResult.lng,
          accuracy: ipResult.accuracy,
          source: 'ip',
          district,
          geocode,
          inKarnataka: isInKarnataka(ipResult.lat, ipResult.lng),
          warning: 'GPS unavailable. Using approximate IP location.',
        });
      } else if (!cancelled) {
        emit({
          status: GEO_STATUS.UNAVAILABLE,
          error: 'Could not determine location. Please enter manually.',
        });
      }
      return;
    }

    // ── Success — reverse geocode the best position ───────────
    const district = findNearestDistrict(best.lat, best.lng);
    const inKarnataka = isInKarnataka(best.lat, best.lng);

    emit({
      status: GEO_STATUS.ACQUIRED,
      lat: best.lat,
      lng: best.lng,
      accuracy: Math.round(best.accuracy),
      source: best.source,
      district,
      inKarnataka,
    });

    // Reverse geocode for address details
    const geocode = await reverseGeocode(best.lat, best.lng);

    if (geocode && !cancelled) {
      emit({
        status: GEO_STATUS.ACQUIRED,
        lat: best.lat,
        lng: best.lng,
        accuracy: Math.round(best.accuracy),
        source: best.source,
        district,
        geocode,
        inKarnataka,
        warning: !inKarnataka
          ? 'Location appears to be outside Karnataka. Please verify the district selection.'
          : undefined,
      });
    }
  })();

  // Return cancel function
  return () => {
    cancelled = true;
  };
}

// ─── React Hook: useGeolocation ───────────────────────────────
/**
 * React hook for geolocation with auto-detection on mount.
 *
 * Usage:
 *   const { location, status, retry, accuracyInfo } = useGeolocation();
 *   // location = { lat, lng, accuracy, source, district, geocode, ... }
 */
import { useState, useEffect, useCallback, useRef } from 'react';

export function useGeolocation(autoStart = true) {
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState(GEO_STATUS.IDLE);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const cancelRef = useRef(null);

  const start = useCallback(() => {
    // Cancel any in-progress detection
    if (cancelRef.current) cancelRef.current();

    setStatus(GEO_STATUS.REQUESTING);
    setError(null);
    setWarning(null);

    cancelRef.current = detectLocation((state) => {
      setStatus(state.status);

      if (state.error) setError(state.error);
      if (state.warning) setWarning(state.warning);
      if (state.guidance) setError(state.guidance);

      if (state.lat != null && state.lng != null) {
        setLocation((prev) => ({
          ...prev,
          lat: state.lat,
          lng: state.lng,
          accuracy: state.accuracy,
          source: state.source,
          district: state.district || prev?.district,
          geocode: state.geocode || prev?.geocode,
          inKarnataka: state.inKarnataka,
        }));
      }
    });
  }, []);

  useEffect(() => {
    if (autoStart) start();
    return () => {
      if (cancelRef.current) cancelRef.current();
    };
  }, [autoStart, start]);

  const accuracyInfo = location?.accuracy
    ? getAccuracyLabel(location.accuracy)
    : null;

  return {
    location,
    status,
    error,
    warning,
    accuracyInfo,
    retry: start,
    isLocating:
      status === GEO_STATUS.REQUESTING ||
      status === GEO_STATUS.COARSE_ACQUIRED ||
      status === GEO_STATUS.REFINING,
    isResolved:
      status === GEO_STATUS.ACQUIRED || status === GEO_STATUS.IP_FALLBACK,
    isDenied: status === GEO_STATUS.DENIED,
  };
}
