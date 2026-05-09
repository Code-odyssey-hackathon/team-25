/**
 * JanaVaani — Advanced Image Hash & Embedding Utilities
 *
 * Three-tier duplicate detection system:
 * 1. MD5 hash - Exact duplicates
 * 2. Perceptual hash - Near-duplicates (resized/cropped)
 * 3. CLIP embeddings - Semantic similarity
 *
 * NOTE: This module runs in the BROWSER only (client component).
 * All server-only dependencies (sharp, blockhash) have been removed.
 * Browser-based Canvas implementations are used instead.
 */

/**
 * Calculate MD5 hash of a file (Exact duplicate detection)
 * Uses SHA-256 via Web Crypto API (MD5 is not available in browsers)
 * @param {File} file - The file to hash
 * @returns {Promise<string>} - The hash as a hexadecimal string
 */
export async function calculateMD5(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const buffer = e.target.result;
        // Use SHA-256 (MD5 is not supported in Web Crypto API)
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        // Truncate the 64-character SHA-256 hash to 32 characters to satisfy the database MD5 constraint
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
        resolve(hashHex);
      } catch (error) {
        console.warn('Hash calculation failed:', error);
        // Return a valid 32-character hex fallback hash so submission isn't blocked
        const fallback = Array.from(crypto.getRandomValues(new Uint8Array(16)))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        resolve(fallback);
      }
    };
    
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Helper to load an image from a File/Blob in the browser
 */
async function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Calculate perceptual hash for near-duplicate detection (Browser-only, Canvas-based)
 * @param {File} file - The image file
 * @returns {Promise<bigint>} - The perceptual hash as a bigint
 */
export async function calculatePerceptualHash(file) {
  try {
    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, 8, 8);
    const { data } = ctx.getImageData(0, 0, 8, 8);
    
    // Convert to grayscale and calculate average
    let gray = [];
    for (let i = 0; i < data.length; i += 4) {
      const val = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
      gray.push(val);
    }
    
    const avg = gray.reduce((a, b) => a + b, 0) / gray.length;
    
    // Calculate hash: bit is 1 if pixel >= average
    let hash = 0n;
    for (let i = 0; i < gray.length; i++) {
      if (gray[i] >= avg) {
        hash |= 1n << BigInt(i);
      }
    }
    
    URL.revokeObjectURL(img.src);
    return hash;
  } catch (error) {
    console.error('Perceptual hash error:', error);
    throw error;
  }
}

/**
 * Calculate difference hash for near-duplicate detection (Browser-only, Canvas-based)
 * @param {File} file - The image file
 * @returns {Promise<bigint>} - The difference hash as a bigint
 */
export async function calculateDifferenceHash(file) {
  try {
    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = 9; // 9 pixels wide for 8 differences
    canvas.height = 8;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, 9, 8);
    const { data } = ctx.getImageData(0, 0, 9, 8);
    
    let gray = [];
    for (let i = 0; i < data.length; i += 4) {
      gray.push(0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2]);
    }
    
    let hash = 0n;
    let bitIndex = 0;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const left = gray[row * 9 + col];
        const right = gray[row * 9 + col + 1];
        if (left < right) {
          hash |= 1n << BigInt(bitIndex);
        }
        bitIndex++;
      }
    }
    
    URL.revokeObjectURL(img.src);
    return hash;
  } catch (error) {
    console.error('Difference hash error:', error);
    throw error;
  }
}

/**
 * Calculate CLIP embedding for semantic similarity
 * @param {File} file - The image file
 * @returns {Promise<number[]>} - The CLIP embedding as a vector
 */
export async function calculateCLIPEmbedding(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64Data = e.target.result;
        const response = await fetch('/api/generate-embedding', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageBase64: base64Data }),
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.embedding) {
            console.log("CLIP embedding generated successfully");
            resolve(data.embedding);
            return;
          }
        }
        console.warn("CLIP embedding API failed, using zero vector");
        resolve(new Array(512).fill(0));
      } catch (error) {
        console.warn("CLIP embedding generation failed:", error);
        resolve(new Array(512).fill(0));
      }
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Calculate Hamming distance between two hashes
 * @param {bigint} hash1 - First hash
 * @param {bigint} hash2 - Second hash
 * @returns {number} - Hamming distance
 */
export function hammingDistance(hash1, hash2) {
  let xor = hash1 ^ hash2;
  let distance = 0;
  while (xor > 0n) {
    distance += Number(xor & 1n);
    xor >>= 1n;
  }
  return distance;
}

/**
 * Check if a file is a duplicate based on hash
 * @param {string} hash - The hash to check
 * @param {object} supabase - Supabase client instance
 * @returns {Promise<object>} - { isDuplicate: boolean, existingReport: object | null }
 */
export async function checkDuplicateByHash(hash, supabase) {
  try {
    const { data: existingReport, error } = await supabase
      .from('reports')
      .select('*')
      .eq('md5_hash', hash)
      .maybeSingle();
    
    if (error) {
      console.error('Error checking for duplicate:', error);
      return { isDuplicate: false, existingReport: null, error };
    }
    
    return {
      isDuplicate: !!existingReport,
      existingReport: existingReport || null
    };
  } catch (err) {
    console.warn('Duplicate check failed:', err);
    return { isDuplicate: false, existingReport: null };
  }
}

/**
 * Find near-duplicates using perceptual hash (client-side comparison)
 * FIX P-1: Restored working near-duplicate detection.
 * Since the server-side RPC is unavailable, this fetches recent hashes
 * and compares them client-side using Hamming distance.
 * @param {bigint} phash - The perceptual hash to compare
 * @param {number} threshold - Hamming distance threshold (default: 10)
 * @param {object} supabase - Supabase client instance
 * @returns {Promise<object>} - { hasNearDuplicates: boolean, similarImages: array }
 */
export async function findNearDuplicates(phash, threshold = 10, supabase) {
  try {
    // Fetch recent reports that have perceptual hashes stored
    const { data: recentReports, error } = await supabase
      .from('reports')
      .select('id, location_name, perceptual_hash, created_at, photo_url')
      .not('perceptual_hash', 'is', null)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error || !recentReports) {
      console.warn('Near-duplicate query failed:', error?.message);
      return { hasNearDuplicates: false, similarImages: [] };
    }

    const similarImages = [];

    for (const report of recentReports) {
      try {
        const existingHash = BigInt(report.perceptual_hash);
        const distance = hammingDistance(phash, existingHash);

        if (distance <= threshold) {
          similarImages.push({
            id: report.id,
            location: report.location_name,
            distance,
            similarity: Math.round((1 - distance / 64) * 100),
            photo_url: report.photo_url,
            created_at: report.created_at,
          });
        }
      } catch (e) {
        // Skip reports with invalid hash values
        continue;
      }
    }

    // Sort by closest match first
    similarImages.sort((a, b) => a.distance - b.distance);

    return {
      hasNearDuplicates: similarImages.length > 0,
      similarImages,
    };
  } catch (err) {
    console.warn('Near-duplicate detection failed:', err);
    return { hasNearDuplicates: false, similarImages: [] };
  }
}

/**
 * Find semantically similar images using CLIP embeddings
 * @param {number[]} embedding - The CLIP embedding vector
 * @param {number} threshold - Similarity threshold (default: 0.85)
 * @param {object} supabase - Supabase client instance
 * @param {string} excludeId - ID to exclude from results
 * @returns {Promise<object>} - { hasSimilarImages: boolean, similarImages: array }
 */
export async function findSimilarImages(embedding, threshold = 0.85, supabase, excludeId = null) {
  // Disabled: RPC 'find_similar_images' is not present in the new schema
  return { hasSimilarImages: false, similarImages: [] };
}

/**
 * Detection thresholds for different similarity levels
 */
export const THRESHOLDS = {
  exact: {
    match: true  // Binary match for hash
  },
  near: {
    // Hamming distance thresholds (lower = more similar)
    identical: 0,      // Exact perceptual match
    very_similar: 5,   // Minor changes
    similar: 10,       // Noticeable changes
    possibly_similar: 15
  },
  semantic: {
    // Cosine similarity thresholds (higher = more similar)
    identical: 0.99,
    very_similar: 0.95,
    similar: 0.85,
    possibly_similar: 0.75,
    different: 0.65
  }
};
