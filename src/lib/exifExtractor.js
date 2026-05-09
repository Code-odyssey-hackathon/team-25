/**
 * Extract EXIF metadata from images for freshness detection
 */
import ExifReader from 'exifreader';

const MAX_PHOTO_AGE_DAYS = 1; // Only accept photos taken within the last 24 hours

export async function extractExifData(file) {
  try {
    let buffer;
    
    if (file instanceof File || file instanceof Blob) {
      buffer = await file.arrayBuffer();
    } else {
      buffer = file;
    }

    const tags = await ExifReader.load(buffer, {
      expanded: true,
      includeUnknown: true
    });

    const dateTaken = tags.exif?.DateTimeOriginal?.description 
      || tags.exif?.DateTime?.description
      || tags.exif?.CreateDate?.description
      || tags.exif?.ModifyDate?.description;

    const gps = tags.gps;
    let lat = null, lng = null;
    
    if (gps && gps.latitude !== undefined && gps.longitude !== undefined) {
      lat = gps.latitude;
      lng = gps.longitude;
    } else if (tags.exif?.GPSLatitude && tags.exif?.GPSLongitude) {
      lat = convertDmsToDecimal(tags.exif.GPSLatitude, tags.exif.GPSLatitudeRef);
      lng = convertDmsToDecimal(tags.exif.GPSLongitude, tags.exif.GPSLongitudeRef);
    }

    return {
      dateTaken: dateTaken ? parseExifDate(dateTaken) : null,
      lat,
      lng,
      deviceMake: tags.exif?.Make?.description || null,
      deviceModel: tags.exif?.Model?.description || null,
      hasExif: !!tags.exif,
      exifSource: tags.exif?.DateTimeOriginal ? 'DateTimeOriginal' 
        : tags.exif?.DateTime ? 'DateTime'
        : tags.exif?.CreateDate ? 'CreateDate'
        : tags.exif?.ModifyDate ? 'ModifyDate'
        : 'none'
    };
  } catch (error) {
    console.error('EXIF extraction failed:', error);
    return {
      dateTaken: null,
      lat: null,
      lng: null,
      deviceMake: null,
      deviceModel: null,
      hasExif: false,
      exifSource: 'error',
      error: error.message
    };
  }
}

function parseExifDate(dateStr) {
  if (!dateStr) return null;
  const clean = dateStr.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
  const date = new Date(clean);
  return isNaN(date.getTime()) ? null : date;
}

function convertDmsToDecimal(dms, ref) {
  if (!dms || !ref) return null;
  let decimal = dms[0] + dms[1]/60 + dms[2]/3600;
  if (ref === 'S' || ref === 'W') decimal = -decimal;
  return decimal;
}

export function checkImageFreshness(exifData, reportedLat = null, reportedLng = null) {
  const result = {
    isFresh: false,
    isValid: false,
    message: '',
    ageDays: null,
    locationMatch: null,
    warnings: []
  };

  if (!exifData.hasExif) {
    result.warnings.push('No EXIF metadata found');
    result.message = 'Cannot verify photo freshness';
    result.isFresh = true;
    return result;
  }

  if (!exifData.dateTaken) {
    result.warnings.push('No capture date in EXIF data');
    result.message = 'Cannot determine when photo was taken';
    result.isFresh = true;
    return result;
  }

  const now = new Date();
  const ageMs = now - exifData.dateTaken;
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  result.ageDays = Math.round(ageDays * 10) / 10;

  if (ageDays > MAX_PHOTO_AGE_DAYS) {
    result.message = `Photo is ${Math.round(ageDays)} days old (max ${MAX_PHOTO_AGE_DAYS} days allowed)`;
    result.warnings.push('Photo exceeds freshness threshold');
    result.isFresh = false;  // FIX E-1: Actually reject stale photos
    return result;
  }

  result.isFresh = true;

  if (exifData.lat !== null && exifData.lng !== null && reportedLat && reportedLng) {
    const distance = calculateDistance(exifData.lat, exifData.lng, reportedLat, reportedLng);
    result.locationMatch = { distance: Math.round(distance), exifLat: exifData.lat, exifLng: exifData.lng };

    if (distance > 500) {
      result.warnings.push(`Photo taken ${Math.round(distance)}m from reported location`);
    }
  } else if (!exifData.lat || !exifData.lng) {
    result.warnings.push('No GPS data in photo');
  }

  result.isValid = result.warnings.length === 0;
  result.message = result.isValid 
    ? 'Photo freshness verified'
    : `Photo fresh but: ${result.warnings.join(', ')}`;

  return result;
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
