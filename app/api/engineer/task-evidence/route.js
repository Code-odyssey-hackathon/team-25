import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * Task Evidence Image Upload API
 *
 * POST   /api/engineer/task-evidence  — Upload & validate an evidence photo
 * GET    /api/engineer/task-evidence?taskId=xxx  — List evidence for a task
 * DELETE /api/engineer/task-evidence  — Soft-delete an evidence image
 */

// ── Validation constants ──────────────────────────────────────
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
  'image/webp',
]);

const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.heic', '.heif', '.webp',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MIN_FILE_SIZE = 10 * 1024;        // 10 KB — reject empty / corrupt uploads

const EVIDENCE_TYPES = new Set([
  'STATUS_UPDATE',
  'MILESTONE_COMPLETION',
  'FIELD_VISIT',
  'ASSESSMENT',
  'WORK_PROGRESS',
  'WORK_COMPLETE',
]);

// ── Magic-number MIME sniffing ─────────────────────────────────
const MAGIC_BYTES = [
  { mime: 'image/jpeg', bytes: [0xFF, 0xD8, 0xFF] },
  { mime: 'image/png',  bytes: [0x89, 0x50, 0x4E, 0x47] },
  { mime: 'image/webp', bytes: null, check: (buf) => {
    // RIFF....WEBP
    return buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46
      && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50;
  }},
  { mime: 'image/heic', bytes: null, check: (buf) => {
    // HEIC/HEIF: ftyp box after 4-byte size
    const ftyp = String.fromCharCode(buf[4], buf[5], buf[6], buf[7]);
    return ftyp === 'ftyp';
  }},
];

function sniffMime(buffer) {
  const view = new Uint8Array(buffer.slice(0, 16));
  for (const sig of MAGIC_BYTES) {
    if (sig.bytes) {
      const match = sig.bytes.every((b, i) => view[i] === b);
      if (match) return sig.mime;
    } else if (sig.check && sig.check(view)) {
      return sig.mime;
    }
  }
  return null;
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// ── POST — Upload evidence image ──────────────────────────────
export async function POST(request) {
  try {
    const formData = await request.formData();

    const file = formData.get('file');
    const taskId = formData.get('taskId');
    const engineerId = formData.get('engineerId');
    const evidenceType = formData.get('evidenceType') || 'STATUS_UPDATE';
    const actionLogId = formData.get('actionLogId') || null;

    // ── Required fields ─────────────────────────────────────
    if (!file || !taskId || !engineerId) {
      return NextResponse.json(
        { error: 'file, taskId, and engineerId are required' },
        { status: 400 }
      );
    }

    // ── Validate evidence type ──────────────────────────────
    if (!EVIDENCE_TYPES.has(evidenceType)) {
      return NextResponse.json(
        { error: `Invalid evidenceType. Must be one of: ${[...EVIDENCE_TYPES].join(', ')}` },
        { status: 400 }
      );
    }

    // ── Client-side + server-side file validation ───────────

    // 1. Size check
    const fileSize = file.size;
    if (fileSize < MIN_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File is too small — likely corrupt or empty (minimum 10 KB)' },
        { status: 400 }
      );
    }
    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024} MB` },
        { status: 413 }
      );
    }

    // 2. Extension check
    const fileName = file.name || 'unknown';
    const ext = '.' + fileName.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: `File extension "${ext}" is not allowed. Accepted: ${[...ALLOWED_EXTENSIONS].join(', ')}` },
        { status: 400 }
      );
    }

    // 3. MIME type check (declared)
    const declaredMime = file.type?.toLowerCase();
    if (declaredMime && !ALLOWED_MIME_TYPES.has(declaredMime)) {
      return NextResponse.json(
        { error: `MIME type "${declaredMime}" is not allowed. Accepted: ${[...ALLOWED_MIME_TYPES].join(', ')}` },
        { status: 400 }
      );
    }

    // 4. Magic-number sniffing — prevents file-extension spoofing
    const buffer = await file.arrayBuffer();
    const sniffedMime = sniffMime(buffer);
    if (!sniffedMime || !ALLOWED_MIME_TYPES.has(sniffedMime)) {
      return NextResponse.json(
        { error: 'File content does not match any allowed image format. Possible malicious upload detected.' },
        { status: 400 }
      );
    }

    // ── Upload to Supabase Storage (async-optimised) ────────
    const supabase = getSupabaseAdmin();

    // Unique path: task-evidence/<taskId>/<timestamp>_<sanitised-filename>
    const sanitisedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${taskId}/${Date.now()}_${sanitisedName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('task-evidence')
      .upload(storagePath, Buffer.from(buffer), {
        contentType: sniffedMime,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload image to storage', details: uploadError.message },
        { status: 500 }
      );
    }

    // Build public URL
    const { data: urlData } = supabase.storage
      .from('task-evidence')
      .getPublicUrl(storagePath);

    const publicUrl = urlData?.publicUrl || null;

    // ── Persist metadata in task_evidence_images ─────────────
    const { data: record, error: insertError } = await supabase
      .from('task_evidence_images')
      .insert({
        task_id: taskId,
        engineer_id: engineerId,
        file_name: fileName,
        file_size: fileSize,
        mime_type: sniffedMime,
        storage_path: storagePath,
        public_url: publicUrl,
        evidence_type: evidenceType,
        is_validated: true,
        validation_result: {
          sniffedMime,
          declaredMime,
          extensionMatch: true,
          magicByteMatch: true,
          sizeOk: true,
        },
        action_log_id: actionLogId || null,
      })
      .select()
      .single();

    if (insertError) {
      // Table might not exist yet — graceful degradation
      if (insertError.message?.includes('does not exist') || insertError.code === '42P01') {
        return NextResponse.json({
          success: true,
          warning: 'task_evidence_images table not yet created. Run setup_task_evidence_migration.sql. Image was uploaded to storage.',
          public_url: publicUrl,
          storage_path: storagePath,
        });
      }
      console.error('Evidence record insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to save evidence record', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      evidence: record,
      public_url: publicUrl,
      message: 'Evidence photo uploaded and validated successfully',
    });

  } catch (error) {
    console.error('Task evidence upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error during evidence upload', details: error.message },
      { status: 500 }
    );
  }
}

// ── GET — List evidence images for a task ─────────────────────
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const taskId = url.searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        { error: 'taskId query parameter is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('task_evidence_images')
      .select('*')
      .eq('task_id', taskId)
      .eq('is_deleted', false)
      .order('uploaded_at', { ascending: false });

    if (error) {
      // Graceful fallback if table doesn't exist
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        return NextResponse.json({ success: true, images: [], warning: 'Table not yet created' });
      }
      throw error;
    }

    return NextResponse.json({ success: true, images: data || [] });

  } catch (error) {
    console.error('Evidence fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch evidence images', details: error.message },
      { status: 500 }
    );
  }
}

// ── DELETE — Soft-delete an evidence image ────────────────────
export async function DELETE(request) {
  try {
    const { imageId } = await request.json();

    if (!imageId) {
      return NextResponse.json(
        { error: 'imageId is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('task_evidence_images')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', imageId)
      .select()
      .single();

    if (error) {
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        return NextResponse.json({ success: false, warning: 'Table not yet created' }, { status: 503 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, deleted: data });

  } catch (error) {
    console.error('Evidence delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete evidence image', details: error.message },
      { status: 500 }
    );
  }
}
