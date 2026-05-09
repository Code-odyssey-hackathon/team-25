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
const AI_VALIDATION_TIMEOUT = 30_000; // 30 seconds

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = (error) => reject(error);
});

/**
 * Validate an uploaded image for freshness, AI-generation, NSFW content,
 * and civic infrastructure relevance.
 *
 * @param {File} file - The image file to validate
 * @param {Object|null} reportedLocation - { lat, lng } or null
 * @returns {Promise<Object>} - Validation result with valid, message, errors, warnings, exifData
 */
export async function validateImage(file, reportedLocation = null) {
  if (!file) {
    return { valid: true, message: 'No file to validate' };
  }

  const errors = [];
  const warnings = [];
  let exifData = null;
  let freshnessResult = null;

  // Step 1: Extract EXIF metadata
  try {
    exifData = await extractExifData(file);
  } catch (err) {
    console.error('EXIF extraction error:', err);
    warnings.push('Could not read image metadata');
  }

  // Step 2: Check photo freshness
  try {
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

  // Reject early if stale photo — no need for AI validation
  if (errors.length > 0) {
    return {
      valid: false,
      message: errors.join('. '),
      errors,
      warnings,
      exifData
    };
  }

  // Step 3: AI Validation via our Next.js API route
  let aiValidationResult = null;  // Declared in outer scope so it's always accessible

  try {
    const base64String = await fileToBase64(file);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_VALIDATION_TIMEOUT);

    const response = await fetch('/api/validate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: base64String,
        fileName: file.name,
        exifData: {
          hasExif: exifData?.hasExif,
          dateTaken: exifData?.dateTaken || null,
          lat: exifData?.lat || null,
          lng: exifData?.lng || null
        }
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('AI validation API error:', response.status, errorText);

      if (response.status === 413) {
        warnings.push('Image too large for AI validation');
      } else if (response.status >= 500) {
        warnings.push('AI validation service temporarily unavailable');
      } else {
        warnings.push('AI validation returned an error');
      }
    } else {
      const data = await response.json();

      if (data.success === false) {
        if (data.error && data.error.toLowerCase().includes('loading')) {
          warnings.push('AI model is loading, please try again shortly');
        } else if (data.detect_reason === 'not_an_image') {
          errors.push('The uploaded file does not appear to be a valid image.');
        } else {
          errors.push(data.error || 'Image validation failed');
        }
      }

      // Propagate AI detection warning if server couldn't run detection
      if (data.aiDetectionWarning) {
        warnings.push(data.aiDetectionWarning);
      }

      // Store the successful result for use below
      aiValidationResult = data;
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('AI validation request timed out');
      warnings.push('AI validation timed out — please try again');
    } else {
      console.error('AI validation request error:', error);
      warnings.push('AI validation failed — please try again');
    }
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
      dateTaken: exifData?.dateTaken || null,
      ageDays: freshnessResult?.ageDays || null,
      locationMatch: freshnessResult?.locationMatch || null,
      deviceInfo: (exifData?.deviceMake && exifData?.deviceModel)
        ? `${exifData.deviceMake} ${exifData.deviceModel}`
        : null
    },
    structureConfidence: aiValidationResult?.structureConfidence || null,
  };
}