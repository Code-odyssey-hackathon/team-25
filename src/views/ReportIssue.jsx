import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase'
import { submitReport } from '../lib/reports'
import { validateImage } from '../lib/imageValidator'
import { classifyIssue } from '../lib/issueClassifier'

import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

import { FLAGS } from '../lib/features'
import VoiceRecorder from '../components/VoiceRecorder'

const ISSUE_TYPES = ['POTHOLE', 'ROAD_CRACK', 'WATER_LEAK', 'STREETLIGHT_OUT', 'GARBAGE_DUMP', 'STRUCTURAL_DAMAGE', 'DRAINAGE_ISSUE', 'OTHER'];
const SEVERITIES = ['VISIBLE', 'SERIOUS', 'DANGEROUS'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function ReportIssue() {
  const router = useRouter();
  const { user, loading: authLoading, isVerified } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ 
    issue_type: 'POTHOLE', 
    severity: 'SERIOUS', 
    description: '',
    location_name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    lat: null,
    lng: null
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [imageVerified, setImageVerified] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [classificationResult, setClassificationResult] = useState(null);

  // Restore offline draft
  useEffect(() => {
    const draft = localStorage.getItem('civil_draft_report');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setForm(prev => ({ ...prev, ...parsed }));
        showToast('Draft restored from offline session', 'info');
      } catch (e) { /* ignore corrupt drafts */ }
    }
  }, [showToast]);

  // Get user location on mount and reverse geocode
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          setForm(prev => ({ ...prev, lat, lng }));

          try {
            // Auto-fetch address info using reverse geocoding
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            if (res.ok) {
              const data = await res.json();
              const addr = data.address || {};
              setForm(prev => ({
                ...prev,
                location_name: data.name || prev.location_name,
                address: addr.road || addr.suburb || data.display_name || prev.address,
                city: addr.city || addr.town || addr.village || addr.county || prev.city,
                state: addr.state || prev.state,
                pincode: addr.postcode || prev.pincode
              }));
              showToast('Location automatically fetched!', 'success');
            }
          } catch (e) {
            console.log('Reverse geocoding error:', e);
          }
        },
        (error) => {
          console.log('Geolocation error:', error);
        }
      );
    }
  }, []);

  async function handleFileSelect(file) {
    if (!file) return;
    setError(null); setPhoto(file); setPhotoPreview(URL.createObjectURL(file)); setImageVerified(false);
    
    // Classify the issue type from the image using AI
    setClassifying(true);
    setClassificationResult(null);
    try {
      const classification = await classifyIssue(file);
      if (classification.success && classification.issue_type !== 'OTHER') {
        setClassificationResult(classification);
        
        // Auto-set severity based on confidence
        let autoSeverity = 'VISIBLE';
        if (classification.confidence >= 80) autoSeverity = 'DANGEROUS';
        else if (classification.confidence >= 50) autoSeverity = 'SERIOUS';

        setForm(prev => ({
          ...prev,
          issue_type: classification.issue_type,
          severity: autoSeverity,
          description: classification.description
        }));

        const readableName = classification.issue_type.replace(/_/g, ' ');
        showToast(`🎯 AI detected: ${readableName} (${classification.confidence}% confidence)`, 'success');
      } else if (classification.success) {
        setClassificationResult(classification);
        showToast('⚠️ Could not auto-detect issue type. Please select manually.', 'warning');
      }
    } catch (err) {
      console.error('Classification error:', err);
    } finally {
      setClassifying(false);
    }
  }

  function handleDrop(e) { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files?.[0]); }
  function removePhoto() { setPhoto(null); setPhotoPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; setImageVerified(false); setClassificationResult(null); }

  function handleTranscriptionComplete(transcript, parsedData) {
    setForm(prev => ({
      ...prev,
      description: transcript,
      ...(parsedData?.issue_type ? { issue_type: parsedData.issue_type } : {}),
      ...(parsedData?.severity ? { severity: parsedData.severity } : {})
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!user) return setError('You must be logged in to submit a report.');
    if (!isVerified) return setError('Please verify your email before submitting reports.');
    if (!form.location_name) return setError('Please provide a location name.');
    if (!form.city) return setError('Please provide the city.');
    if (!photo) return setError('Photo evidence is required.');

    // AI Image Validation + EXIF Freshness Check
    setScanning(true);
    setError(null);
    let validationResult = null;
    
    try {
      const reportedLocation = form.lat && form.lng ? { lat: form.lat, lng: form.lng } : null;
      validationResult = await validateImage(photo, reportedLocation);
      
      if (!validationResult.valid) {
        showToast(validationResult.message, 'warning');
        setScanning(false);
        return;
      }
      
      if (validationResult.warnings?.length > 0) {
        console.log('Photo warnings:', validationResult.warnings);
      }
    } catch (err) {
      console.error('Validation error:', err);
    }
    setScanning(false);

    // Offline check
    if (!navigator.onLine) {
      localStorage.setItem('civil_draft_report', JSON.stringify(form));
      showToast('You are offline. Report saved as draft.', 'warning');
      return;
    }

    setSubmitting(true); setError(null);
    try {
      // Append user ID and location data to the report submission
      const finalForm = { ...form, citizen_id: user.id };
      await submitReport(finalForm, photo, validationResult?.exifData);
      localStorage.removeItem('civil_draft_report');
      showToast('Report submitted successfully!', 'success');
      setSuccess(true);
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  }

  if (authLoading) return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="spinner"></div>
    </div>
  );

  if (!user) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <div className="glass-panel" style={{ maxWidth: 500, width: '100%', textAlign: 'center', padding: '3rem', animation: 'fadeInUp 0.5s ease' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🛡️</div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.75rem' }}>Login Required</h2>
          <p className="text-gray" style={{ marginBottom: '1.5rem', lineHeight: 1.6 }}>
            To prevent spam and ensure the authenticity of reports, you must be logged in as a verified citizen to report infrastructure issues.
          </p>
          <button className="btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }} onClick={() => router.push('/citizen/login')}>
            Go to Citizen Login →
          </button>
        </div>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <div className="glass-panel" style={{ maxWidth: 500, width: '100%', textAlign: 'center', padding: '3rem', animation: 'fadeInUp 0.5s ease' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📧</div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.75rem' }}>Verify Your Email</h2>
          <p className="text-gray" style={{ marginBottom: '1rem', lineHeight: 1.6 }}>
            Your account is not yet verified. Please check your inbox for a confirmation email from JanaVaani and click the verification link.
          </p>
          <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '1rem', marginBottom: '1.5rem', fontSize: '0.9rem', color: '#fbbf24' }}>
            ⏳ Once verified, refresh this page to start reporting.
          </div>
          <button className="btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }} onClick={() => window.location.reload()}>
            🔄 I've Verified — Refresh
          </button>
        </div>
      </div>
    );
  }

  if (success) return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
      <div className="glass-panel" style={{ maxWidth: 500, width: '100%', textAlign: 'center', padding: '3rem', animation: 'fadeInUp 0.5s ease' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '0.75rem' }}>Report Submitted</h2>
        <p className="text-gray" style={{ marginBottom: '1.5rem', lineHeight: 1.6 }}>
          Your evidence has been logged on the public record. Authorities have been notified.
          If no action is taken within <strong style={{ color: '#f97316' }}>30 days</strong>,
          this report is automatically escalated and marked as <strong style={{ color: '#ef4444' }}>IGNORED</strong>.
        </p>
        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '1rem', marginBottom: '2rem', fontSize: '0.9rem', color: '#6ee7b7' }}>
          📣 This report is now <strong>publicly visible</strong> on the Reports Feed.
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-primary" style={{ flex: 1 }} onClick={() => router.push('/feed')}>See All Reports</button>
          <button className="btn-secondary" style={{ flex: 1 }} onClick={() => { setSuccess(false); setForm({ issue_type: 'POTHOLE', severity: 'SERIOUS', description: '', location_name: '', address: '', city: '', state: '', pincode: '', lat: null, lng: null }); setPhoto(null); setPhotoPreview(null); }}>Report Another</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <div className="glass-panel" style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem', textAlign: 'left' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>📸 Report Infrastructure Issue</h1>
        
        <p className="text-gray" style={{ marginBottom: '0.5rem' }}>Photo evidence is required to submit a verified report.</p>
        
        <form onSubmit={handleSubmit} style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {FLAGS.ENABLE_VOICE_REPORT && (
            <VoiceRecorder onTranscriptionComplete={handleTranscriptionComplete} />
          )}

          <label>
            <span style={{ fontWeight: 600 }}>Location Name *</span>
            <input 
              className="form-input" 
              type="text" 
              value={form.location_name} 
              onChange={e => setForm({ ...form, location_name: e.target.value })} 
              placeholder="e.g., Main Road Junction, Market Street" 
              required
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label>
              <span style={{ fontWeight: 600 }}>City *</span>
              <input 
                className="form-input" 
                type="text" 
                value={form.city} 
                onChange={e => setForm({ ...form, city: e.target.value })} 
                placeholder="e.g., Hubli" 
                required
              />
            </label>
            <label>
              <span style={{ fontWeight: 600 }}>State *</span>
              <input 
                className="form-input" 
                type="text" 
                value={form.state} 
                onChange={e => setForm({ ...form, state: e.target.value })} 
                placeholder="e.g., Karnataka" 
                required
              />
            </label>
          </div>

          <label>
            <span style={{ fontWeight: 600 }}>Address</span>
            <input 
              className="form-input" 
              type="text" 
              value={form.address} 
              onChange={e => setForm({ ...form, address: e.target.value })} 
              placeholder="Street address or landmark" 
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label>
              <span style={{ fontWeight: 600 }}>Pincode</span>
              <input 
                className="form-input" 
                type="text" 
                value={form.pincode} 
                onChange={e => setForm({ ...form, pincode: e.target.value })} 
                placeholder="e.g., 580020" 
              />
            </label>
            <label>
              <span style={{ fontWeight: 600 }}>Issue Type *</span>
              <select className="form-input" value={form.issue_type} onChange={e => setForm({ ...form, issue_type: e.target.value })}>
                {ISSUE_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </label>
          </div>

          <label>
            <span style={{ fontWeight: 600 }}>Severity *</span>
            <select className="form-input" value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
              {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>

          <label>
            <span style={{ fontWeight: 600 }}>Description</span>
            <textarea className="form-input" rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the visible damage or danger..." />
          </label>
          
          <div>
            <span style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Photo Evidence *</span>
            <div onClick={() => fileInputRef.current?.click()} onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
              style={{ border: `2px dashed ${dragOver ? 'var(--color-accent)' : 'var(--color-glass-border)'}`, borderRadius: 12, padding: photoPreview ? '0' : '2.5rem 1.5rem', textAlign: 'center', cursor: 'pointer', background: dragOver ? 'rgba(59,130,246,0.1)' : 'rgba(0,0,0,0.3)', transition: '0.2s', position: 'relative', overflow: 'hidden' }}>
              {photoPreview ? (
                <>
                  <div style={{ position: 'relative' }}>
                    <img src={photoPreview} alt="Preview" style={{ width: '100%', maxHeight: 280, objectFit: 'cover', borderRadius: 10, display: 'block' }} />
                    <button type="button" onClick={e => { e.stopPropagation(); removePhoto() }} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', padding: '1rem', color: '#fff', fontSize: '0.85rem' }}>📎 {photo?.name} · {(photo?.size / 1024 / 1024).toFixed(1)}MB</div>
                  </div>

                </>
              ) : (
                <><div style={{ fontSize: '3rem', marginBottom: '0.75rem', opacity: 0.6 }}>📷</div><p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>{dragOver ? 'Drop image here' : 'Click or drag to upload photo'}</p><p className="text-gray" style={{ fontSize: '0.85rem' }}>JPG, PNG up to 5MB</p></>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={e => handleFileSelect(e.target.files?.[0])} style={{ display: 'none' }} />
          </div>
          
          {error && <p className="text-red" style={{ fontWeight: 600 }}>⚠️ {error}</p>}
          {scanning && <p style={{ fontWeight: 600, color: '#f59e0b' }}>🔍 Verifying image authenticity...</p>}
          {classifying && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 10, animation: 'fadeInUp 0.3s ease' }}>
              <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></div>
              <p style={{ fontWeight: 600, color: '#60a5fa', margin: 0 }}>🤖 AI is analyzing your image to auto-detect issue type...</p>
            </div>
          )}
          {classificationResult && !classifying && (
            <div style={{ padding: '1rem', background: classificationResult.issue_type !== 'OTHER' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', border: `1px solid ${classificationResult.issue_type !== 'OTHER' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`, borderRadius: 10, animation: 'fadeInUp 0.3s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 700, color: classificationResult.issue_type !== 'OTHER' ? '#10b981' : '#f59e0b', fontSize: '1rem' }}>
                  {classificationResult.issue_type !== 'OTHER' ? '✅ AI Classification Result' : '⚠️ Manual Selection Needed'}
                </span>
                <span style={{ background: classificationResult.issue_type !== 'OTHER' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)', padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, color: classificationResult.issue_type !== 'OTHER' ? '#6ee7b7' : '#fbbf24' }}>
                  {classificationResult.confidence}% confidence
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {classificationResult.issue_type !== 'OTHER' 
                  ? `Detected: ${classificationResult.issue_type.replace(/_/g, ' ')} — ${classificationResult.description}`
                  : 'Could not confidently identify the issue type. Please select the correct type from the dropdown above.'}
              </p>
            </div>
          )}
          <button type="submit" className="btn-danger" disabled={submitting || scanning}>
            {submitting ? '⏳ Submitting...' : scanning ? '🔍 Scanning...' : '🚨 File Report — Make It Public Record'}
          </button>
        </form>
      </div>
    </div>
  );
}