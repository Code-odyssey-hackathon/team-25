/**
 * JanaVaani — Report Data Service
 *
 * Citizen report submission and management via Supabase with full duplicate detection.
 */
import { supabase } from './supabase';
import { 
  calculateMD5, 
  checkDuplicateByHash,
  calculatePerceptualHash,
  calculateDifferenceHash,
  calculateCLIPEmbedding,
  findNearDuplicates,
  findSimilarImages,
  THRESHOLDS
} from './hashUtils';

/**
 * Fetch all public reports, optionally filtered.
 */
export async function getReports(filters = {}) {
  let query = supabase
    .from('reports')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  if (filters.city) {
    query = query.eq('city', filters.city);
  }
  if (filters.state) {
    query = query.eq('state', filters.state);
  }
  if (filters.issue_type) {
    query = query.eq('issue_type', filters.issue_type);
  }
  if (filters.severity) {
    query = query.eq('severity', filters.severity);
  }
  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  const limit = filters.limit || 20;
  query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Submit a new citizen report for civil infrastructure issues with three-tier duplicate detection.
 * @param {Object} reportData - { issue_type, severity, description, location_name, address, city, state, pincode, lat, lng, citizen_id }
 * @param {File} photo - The damage photo file
 * @param {Object} exifData - Extracted EXIF metadata from photo
 */
export async function submitReport(reportData, photo, exifData = null) {
  let photoUrl = null;
  let photoPath = null;
  let md5Hash = null;
  let phash = null;
  let dhash = null;
  let embedding = null;

  // 1. Three-tier duplicate detection
  if (photo) {
    console.log('🔍 Starting three-tier duplicate detection...');
    
    // Tier 1: Exact duplicate detection (MD5)
    console.log('  Tier 1: Calculating MD5 hash...');
    md5Hash = await calculateMD5(photo);
    
    const { isDuplicate, existingReport } = await checkDuplicateByHash(md5Hash, supabase);
    
    if (isDuplicate) {
      console.log('  ❌ Exact duplicate detected!');
      throw new Error('This photo has already been submitted. Duplicate reports are not allowed.');
    }
    console.log('  ✅ No exact duplicate found');
    
    // Tier 2: Near-duplicate detection (Perceptual hashing)
    console.log('  Tier 2: Calculating perceptual hashes...');
    try {
      phash = await calculatePerceptualHash(photo);
      dhash = await calculateDifferenceHash(photo);
      
      const { hasNearDuplicates, similarImages } = await findNearDuplicates(
        phash, 
        THRESHOLDS.near.similar, 
        supabase
      );
      
      if (hasNearDuplicates) {
        console.log(`  ⚠️  Found ${similarImages.length} near-duplicate(s)`);
        // We don't block near-duplicates, just log them
        // You could implement a warning system here
      } else {
        console.log('  ✅ No near-duplicates found');
      }
    } catch (error) {
      console.warn('  ⚠️  Perceptual hashing failed:', error.message);
      // Continue without perceptual hashing
    }
    
    // Tier 3: Semantic similarity detection (CLIP embeddings)
    console.log('  Tier 3: Calculating CLIP embedding...');
    try {
      embedding = await calculateCLIPEmbedding(photo);
      
      // Only check for similar images if we got a valid embedding
      if (embedding && embedding.some(v => v !== 0)) {
        const { hasSimilarImages, similarImages } = await findSimilarImages(
          embedding,
          THRESHOLDS.semantic.similar,
          supabase
        );
        
        if (hasSimilarImages) {
          console.log(`  ⚠️  Found ${similarImages.length} semantically similar image(s)`);
          // We don't block similar images, just log them
          // You could implement a warning system here
        } else {
          console.log('  ✅ No semantically similar images found');
        }
      } else {
        console.log('  ⚠️  CLIP embedding generation skipped (zero vector)');
      }
    } catch (error) {
      console.warn('  ⚠️  CLIP embedding failed:', error.message);
      // Continue without embedding
    }
    
    console.log('✅ Duplicate detection complete');
  }

  // 2. Upload photo to Supabase Storage
  if (photo) {
    const fileExt = photo.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
    photoPath = `reports/${fileName}`;

    // Convert File to ArrayBuffer to prevent Supabase SDK from incorrectly serializing it as JSON
    const arrayBuffer = await photo.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from('report-photos')
      .upload(photoPath, arrayBuffer, {
        contentType: photo.type || 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      console.warn('⚠️ Supabase Storage upload failed (likely RLS policy missing):', uploadError.message);
      // Fallback to a placeholder image to allow local testing to continue
      photoUrl = `https://placehold.co/600x400/252f3f/ffffff?text=Evidence+Photo%5Cn(Storage+Upload+Failed)`;
    } else {
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('report-photos')
        .getPublicUrl(photoPath);

      photoUrl = urlData.publicUrl;
    }
  }

  // 3. Generate anonymous reporter hash from timestamp
  const reporterHash = `anon_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

  // 4. Insert report with all hashes and embeddings
  const { data, error } = await supabase
    .from('reports')
    .insert({
      location_name: reportData.location_name,
      address: reportData.address || null,
      city: reportData.city,
      state: reportData.state,
      pincode: reportData.pincode || null,
      reporter_hash: reporterHash,
      citizen_id: reportData.citizen_id || null,
      photo_url: photoUrl,
      photo_path: photoPath,
      md5_hash: md5Hash,
      phash: phash != null ? phash.toString() : null,
      dhash: dhash != null ? dhash.toString() : null,
      embedding: embedding,
      issue_type: reportData.issue_type,
      severity: reportData.severity,
      description: reportData.description || null,
      lat: reportData.lat || null,
      lng: reportData.lng || null,
      ai_confidence: reportData.ai_confidence || null,
      // EXIF metadata
      photo_taken_at: exifData?.dateTaken || null,
      photo_lat: exifData?.lat || null,
      photo_lng: exifData?.lng || null,
      photo_device_info: exifData?.deviceInfo || null,
      exif_verified: !!exifData?.dateTaken,
      status: 'PENDING',
      is_public: true,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Update report status (admin only).
 */
export async function updateReportStatus(reportId, statusData, proofPhoto) {
  let proofPhotoUrl = null;

  if (proofPhoto) {
    const fileExt = proofPhoto.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
    const proofPath = `proofs/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('proof-photos')
      .upload(proofPath, proofPhoto, {
        contentType: proofPhoto.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('proof-photos')
      .getPublicUrl(proofPath);

    proofPhotoUrl = urlData.publicUrl;
  }

  const { data, error } = await supabase
    .from('reports')
    .update({
      status: statusData.status,
      response_notes: statusData.notes || null,
      proof_photo_url: proofPhotoUrl || statusData.proof_photo_url || null,
      responded_at: new Date().toISOString(),
      days_unaddressed: 0,
    })
    .eq('id', reportId)
    .select()
    .single();

  if (error) throw error;
  return data;
}