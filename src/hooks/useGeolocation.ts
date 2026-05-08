"use client";

// =============================================================================
// JanaVaani — Geolocation Hook
// Extracts GPS from device or image EXIF metadata
// =============================================================================

import { useState, useCallback } from "react";
import exifr from "exifr";
import type { GeoLocation } from "@/types";

interface UseGeolocationReturn {
  location: GeoLocation | null;
  isLocating: boolean;
  error: string | null;
  getDeviceLocation: () => Promise<GeoLocation | null>;
  getImageLocation: (file: File) => Promise<GeoLocation | null>;
  clearLocation: () => void;
}

export function useGeolocation(): UseGeolocationReturn {
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDeviceLocation = useCallback(async (): Promise<GeoLocation | null> => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return null;
    }

    setIsLocating(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000,
          });
        }
      );

      const loc: GeoLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };

      setLocation(loc);
      return loc;
    } catch (err) {
      const geoError = err as GeolocationPositionError;
      const message =
        geoError.code === 1
          ? "Location permission denied. Please enable GPS."
          : geoError.code === 2
          ? "Location unavailable. Please try again."
          : "Location request timed out. Please try again.";
      setError(message);
      return null;
    } finally {
      setIsLocating(false);
    }
  }, []);

  const getImageLocation = useCallback(async (file: File): Promise<GeoLocation | null> => {
    setIsLocating(true);
    setError(null);

    try {
      const exifData = await exifr.gps(file);

      if (exifData?.latitude && exifData?.longitude) {
        const loc: GeoLocation = {
          latitude: exifData.latitude,
          longitude: exifData.longitude,
        };
        setLocation(loc);
        return loc;
      }

      // No EXIF GPS — fall back to device location
      return await getDeviceLocation();
    } catch {
      // EXIF parsing failed — fall back to device location
      return await getDeviceLocation();
    } finally {
      setIsLocating(false);
    }
  }, [getDeviceLocation]);

  const clearLocation = useCallback(() => {
    setLocation(null);
    setError(null);
  }, []);

  return {
    location,
    isLocating,
    error,
    getDeviceLocation,
    getImageLocation,
    clearLocation,
  };
}
