'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import {
  uploadEvidencePhoto,
  getEvidenceForTask,
  deleteEvidenceImage,
  validateEvidenceFile,
  EVIDENCE_TYPE_LABELS,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE,
} from '../lib/taskEvidence';

/**
 * TaskEvidenceUpload
 *
 * A self-contained, production-grade evidence upload component.
 * Features:
 * - Drag & drop + click-to-browse
 * - Live client-side validation with clear error feedback
 * - Upload progress bar with async XHR
 * - Evidence gallery with lightbox preview
 * - Mandatory enforcement — blocks task status updates until evidence is attached
 *
 * @param {Object}   props
 * @param {string}   props.taskId        - The task UUID
 * @param {string}   props.engineerId    - The engineer UUID
 * @param {string}   [props.evidenceType] - Category of evidence
 * @param {string}   [props.actionLogId]  - Link to an action log entry
 * @param {Function} [props.onUploadComplete] - Callback after successful upload
 * @param {boolean}  [props.required]     - If true, must have ≥1 evidence to unblock
 * @param {Function} [props.onEvidenceStateChange] - Callback with (hasEvidence: bool)
 */
export default function TaskEvidenceUpload({
  taskId,
  engineerId,
  evidenceType = 'STATUS_UPDATE',
  actionLogId = null,
  onUploadComplete = null,
  required = true,
  onEvidenceStateChange = null,
}) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [selectedType, setSelectedType] = useState(evidenceType);

  // ── Load existing evidence gallery ─────────────────────────
  const loadGallery = useCallback(async () => {
    setGalleryLoading(true);
    const images = await getEvidenceForTask(taskId);
    setGallery(images);
    setGalleryLoading(false);
    onEvidenceStateChange?.(images.length > 0);
  }, [taskId, onEvidenceStateChange]);

  useEffect(() => {
    loadGallery();
  }, [loadGallery]);

  // ── File selection handler ─────────────────────────────────
  const handleFile = useCallback((file) => {
    setUploadResult(null);

    const validation = validateEvidenceFile(file);
    if (!validation.valid) {
      setErrors(validation.errors);
      setSelectedFile(null);
      setPreview(null);
      return;
    }

    setErrors([]);
    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  }, []);

  // ── Drag and drop handlers ─────────────────────────────────
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // ── Upload handler ─────────────────────────────────────────
  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    const result = await uploadEvidencePhoto({
      file: selectedFile,
      taskId,
      engineerId,
      evidenceType: selectedType,
      actionLogId,
      onProgress: setUploadProgress,
    });

    setUploading(false);

    if (result.success) {
      setUploadResult({ success: true, message: result.message || 'Evidence uploaded successfully!' });
      setSelectedFile(null);
      setPreview(null);
      await loadGallery();
      onUploadComplete?.(result);
    } else {
      setUploadResult({ success: false, message: result.error || 'Upload failed' });
    }
  };

  // ── Delete handler ─────────────────────────────────────────
  const handleDelete = async (imageId) => {
    if (!confirm('Remove this evidence photo?')) return;
    const ok = await deleteEvidenceImage(imageId);
    if (ok) await loadGallery();
  };

  // ── Clear selection ────────────────────────────────────────
  const clearSelection = () => {
    setSelectedFile(null);
    setPreview(null);
    setErrors([]);
    setUploadResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const hasEvidence = gallery.length > 0;

  return (
    <div className="evidence-upload-container">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="evidence-header">
        <div className="evidence-header-left">
          <span className="evidence-icon">📷</span>
          <span className="evidence-title">Evidence Photos</span>
          {required && (
            <span className={`evidence-badge ${hasEvidence ? 'evidence-badge-ok' : 'evidence-badge-required'}`}>
              {hasEvidence ? '✓ Attached' : '⚠ Required'}
            </span>
          )}
        </div>
        <span className="evidence-count">{gallery.length} photo{gallery.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Evidence Type Selector ─────────────────────────── */}
      <div className="evidence-type-selector">
        {Object.entries(EVIDENCE_TYPE_LABELS).map(([key, label]) => (
          <button
            key={key}
            className={`evidence-type-btn ${selectedType === key ? 'active' : ''}`}
            onClick={() => setSelectedType(key)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Drop Zone ──────────────────────────────────────── */}
      <div
        className={`evidence-dropzone ${dragActive ? 'drag-active' : ''} ${preview ? 'has-preview' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_EXTENSIONS.join(',')}
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          style={{ display: 'none' }}
          id={`evidence-file-${taskId}`}
        />

        {preview ? (
          <div className="evidence-preview-container">
            <img src={preview} alt="Evidence preview" className="evidence-preview-img" />
            <div className="evidence-preview-overlay">
              <div className="evidence-preview-meta">
                <span>{selectedFile?.name}</span>
                <span>{(selectedFile?.size / 1024).toFixed(0)} KB</span>
              </div>
              <button className="evidence-clear-btn" onClick={(e) => { e.stopPropagation(); clearSelection(); }} type="button">
                ✕ Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="evidence-dropzone-content">
            <div className="evidence-dropzone-icon">
              {dragActive ? '📥' : '📸'}
            </div>
            <p className="evidence-dropzone-title">
              {dragActive ? 'Drop image here' : 'Drag & drop or click to upload'}
            </p>
            <p className="evidence-dropzone-hint">
              JPEG, PNG, HEIC, WebP · Max {MAX_FILE_SIZE / 1024 / 1024} MB
            </p>
          </div>
        )}
      </div>

      {/* ── Validation Errors ──────────────────────────────── */}
      {errors.length > 0 && (
        <div className="evidence-errors">
          {errors.map((err, i) => (
            <div key={i} className="evidence-error-item">
              <span className="evidence-error-icon">⚠</span> {err}
            </div>
          ))}
        </div>
      )}

      {/* ── Upload Progress ────────────────────────────────── */}
      {uploading && (
        <div className="evidence-progress">
          <div className="evidence-progress-bar">
            <div
              className="evidence-progress-fill"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <span className="evidence-progress-text">{uploadProgress}%</span>
        </div>
      )}

      {/* ── Upload Result ──────────────────────────────────── */}
      {uploadResult && (
        <div className={`evidence-result ${uploadResult.success ? 'evidence-result-success' : 'evidence-result-error'}`}>
          {uploadResult.success ? '✅' : '❌'} {uploadResult.message}
        </div>
      )}

      {/* ── Upload Button ──────────────────────────────────── */}
      {selectedFile && !uploading && (
        <button
          className="evidence-upload-btn"
          onClick={handleUpload}
          type="button"
        >
          📤 Upload Evidence Photo
        </button>
      )}

      {/* ── Evidence Gallery ───────────────────────────────── */}
      {(gallery.length > 0 || galleryLoading) && (
        <div className="evidence-gallery">
          <div className="evidence-gallery-title">Uploaded Evidence</div>
          {galleryLoading ? (
            <div className="evidence-gallery-loading">
              <div className="spinner" style={{ width: 24, height: 24, borderWidth: 2 }} />
            </div>
          ) : (
            <div className="evidence-gallery-grid">
              {gallery.map((img) => (
                <div key={img.id} className="evidence-gallery-item" onClick={() => setLightboxUrl(img.public_url)}>
                  <img src={img.public_url} alt={img.file_name} className="evidence-gallery-thumb" loading="lazy" />
                  <div className="evidence-gallery-meta">
                    <span className="evidence-gallery-type">
                      {EVIDENCE_TYPE_LABELS[img.evidence_type] || img.evidence_type}
                    </span>
                    <span className="evidence-gallery-date">
                      {new Date(img.uploaded_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <button
                    className="evidence-gallery-delete"
                    onClick={(e) => { e.stopPropagation(); handleDelete(img.id); }}
                    title="Remove evidence"
                    type="button"
                  >
                    🗑
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Lightbox ───────────────────────────────────────── */}
      {lightboxUrl && (
        <div className="evidence-lightbox" onClick={() => setLightboxUrl(null)}>
          <div className="evidence-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={lightboxUrl} alt="Evidence full view" className="evidence-lightbox-img" />
            <button className="evidence-lightbox-close" onClick={() => setLightboxUrl(null)} type="button">✕</button>
          </div>
        </div>
      )}

      {/* ── Mandatory Warning ──────────────────────────────── */}
      {required && !hasEvidence && !uploading && (
        <div className="evidence-mandatory-warning">
          <span className="evidence-warning-icon">📷</span>
          Photographic evidence is required before updating task status or marking milestones.
        </div>
      )}
    </div>
  );
}
