/**
 * JanaVaani — Task Evidence Photo Service
 *
 * Client-side utilities for uploading, validating, and fetching
 * mandatory evidence photos attached to engineer task updates.
 *
 * Provides:
 * - Client-side pre-validation (format, size) before hitting the server
 * - Asynchronous upload with progress tracking
 * - Evidence gallery fetching per task
 */

// ── Client-side validation constants ────────────────────────
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.heic', '.heif', '.webp'];
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
  'image/webp',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MIN_FILE_SIZE = 10 * 1024;        // 10 KB

const EVIDENCE_TYPE_LABELS = {
  STATUS_UPDATE:          '📸 Status Update',
  MILESTONE_COMPLETION:   '🏁 Milestone Completion',
  FIELD_VISIT:            '🚶 Field Visit',
  ASSESSMENT:             '📋 Assessment',
  WORK_PROGRESS:          '🔨 Work Progress',
  WORK_COMPLETE:          '✅ Work Complete',
};

export { EVIDENCE_TYPE_LABELS, ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES, MAX_FILE_SIZE };

/**
 * Client-side validation of a File object.
 * Returns { valid: boolean, errors: string[] }
 */
export function validateEvidenceFile(file) {
  const errors = [];

  if (!file) {
    errors.push('No file selected');
    return { valid: false, errors };
  }

  // Size checks
  if (file.size < MIN_FILE_SIZE) {
    errors.push('File is too small (minimum 10 KB). Likely corrupt or empty.');
  }
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File exceeds ${MAX_FILE_SIZE / 1024 / 1024} MB limit.`);
  }

  // Extension check
  const ext = '.' + (file.name || '').split('.').pop().toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    errors.push(`"${ext}" is not a supported format. Use: ${ALLOWED_EXTENSIONS.join(', ')}`);
  }

  // MIME type check
  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
    errors.push(`Unsupported file type "${file.type}".`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Upload an evidence photo via the API route.
 * Performs client validation first, then sends multipart form data.
 *
 * @param {Object} params
 * @param {File}   params.file         - The image file
 * @param {string} params.taskId       - UUID of the task
 * @param {string} params.engineerId   - UUID of the engineer
 * @param {string} [params.evidenceType] - One of the EVIDENCE_TYPE keys
 * @param {string} [params.actionLogId]  - Optional link to action log entry
 * @param {Function} [params.onProgress] - Optional progress callback (0-100)
 * @returns {Promise<Object>} - { success, evidence, public_url, error }
 */
export async function uploadEvidencePhoto({
  file,
  taskId,
  engineerId,
  evidenceType = 'STATUS_UPDATE',
  actionLogId = null,
  onProgress = null,
}) {
  // Client pre-validation
  const validation = validateEvidenceFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.errors.join('; ') };
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('taskId', taskId);
  formData.append('engineerId', engineerId);
  formData.append('evidenceType', evidenceType);
  if (actionLogId) formData.append('actionLogId', actionLogId);

  try {
    // Use XMLHttpRequest for progress tracking on large uploads
    if (onProgress && typeof XMLHttpRequest !== 'undefined') {
      return await _uploadWithProgress(formData, onProgress);
    }

    // Standard fetch for simpler cases
    const res = await fetch('/api/engineer/task-evidence', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data.error || 'Upload failed' };
    }

    return data;
  } catch (err) {
    console.error('Evidence upload error:', err);
    return { success: false, error: err.message || 'Network error during upload' };
  }
}

/**
 * Internal: upload with XHR for progress tracking.
 */
function _uploadWithProgress(formData, onProgress) {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/engineer/task-evidence');

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        onProgress(pct);
      }
    });

    xhr.addEventListener('load', () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data);
        } else {
          resolve({ success: false, error: data.error || 'Upload failed' });
        }
      } catch {
        resolve({ success: false, error: 'Invalid response from server' });
      }
    });

    xhr.addEventListener('error', () => {
      resolve({ success: false, error: 'Network error during upload' });
    });

    xhr.addEventListener('timeout', () => {
      resolve({ success: false, error: 'Upload timed out' });
    });

    xhr.timeout = 60000; // 60s timeout for large files
    xhr.send(formData);
  });
}

/**
 * Fetch all evidence images for a task.
 * @param {string} taskId
 * @returns {Promise<Object[]>}
 */
export async function getEvidenceForTask(taskId) {
  try {
    const res = await fetch(`/api/engineer/task-evidence?taskId=${taskId}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch evidence');
    }
    const { images } = await res.json();
    return images || [];
  } catch (err) {
    console.error('Evidence fetch error:', err);
    return [];
  }
}

/**
 * Soft-delete an evidence image.
 * @param {string} imageId
 * @returns {Promise<boolean>}
 */
export async function deleteEvidenceImage(imageId) {
  try {
    const res = await fetch('/api/engineer/task-evidence', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageId }),
    });
    return res.ok;
  } catch (err) {
    console.error('Evidence delete error:', err);
    return false;
  }
}
