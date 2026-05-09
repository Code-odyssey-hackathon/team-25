/**
 * JanaVaani — Image Validator (with EXIF Freshness Check)
 * 
 * Flow:
 * 1. Extract EXIF metadata (date, GPS)
 * 2. Check photo freshness (max 7 days old)
 * 3. Send to AI detection (Hugging Face)
 * 4. Reject if stale or AI-generated
 */

import { extractExifData, checkImageFreshness } from './exifExtractor';

const CONFIDENCE_THRESHOLD = 0.75;

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = (error) => reject(error);
});

export async function validateImage(file, reportedLocation = null) {
  if (!file) {
    return { valid: true, message: 'No file to validate' };
  }

  const errors = [];
  const warnings = [];
  let exifData = null;
  let freshnessResult = null;

  try {
    // Step 1: Extract EXIF
    exifData = await extractExifData(file);

    // Step 2: Check freshness
    freshnessResult = checkImageFreshness(
      exifData,
      reportedLocation?.lat,
      reportedLocation?.lng
    );

    if (!freshnessResult.isFresh) {
      errors.push(freshnessResult.message);
    } else if (freshnessResult.warnings.length > 0) {
      warnings.push(...freshnessResult.warnings);
    }
  } catch (err) {
    console.error('Freshness check error:', err);
    warnings.push('Could not verify photo freshness');
  }

  // Reject if stale photo
  if (errors.length > 0) {
    return {
      valid: false,
      message: errors.join('. '),
      errors,
      warnings,
      exifData
    };
  }

  // Step 3: AI Validation
  try {
    const base64String = await fileToBase64(file);

    const response = await fetch('/api/validate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        imageBase64: base64String, 
        fileName: file.name,
        exifData: {
          hasExif: exifData?.hasExif,
          dateTaken: exifData?.dateTaken,
          lat: exifData?.lat,
          lng: exifData?.lng
        }
      }),
    });

    if (!response.ok) {
      console.error('API Proxy error:', response.status);
      warnings.push('AI validation unavailable');
    } else {
      const data = await response.json();
      if (data.success === false) {
        if (data.error && data.error.includes("loading")) {
          warnings.push('AI model loading');
        } else {
          errors.push(data.error || 'Image validation failed');
        }
      }
    }
  } catch (error) {
    console.error('AI validation error:', error);
    warnings.push('AI validation failed');
  }

  const isValid = errors.length === 0;

  return {
    valid: isValid,
    message: isValid 
      ? `Verified (${freshnessResult?.ageDays !== null ? freshnessResult.ageDays + ' days old' : 'age unknown'})`
      : errors.join('. '),
    errors,
    warnings,
    exifData: {
      dateTaken: exifData?.dateTaken,
      ageDays: freshnessResult?.ageDays,
      locationMatch: freshnessResult?.locationMatch,
      deviceInfo: exifData?.deviceMake && exifData?.deviceModel 
        ? `${exifData.deviceMake} ${exifData.deviceModel}`
        : null
    }
  };
}