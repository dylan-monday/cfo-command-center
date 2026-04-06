/**
 * Google Drive Inbox Sweep Cron Job
 *
 * Monitors "CFO Inbox" folder in Google Drive, automatically parses new files,
 * stores them in Supabase, and moves them to "CFO Processed" folder.
 *
 * Vercel cron schedule: every 30 minutes
 *
 * Can also be triggered manually from dashboard via POST request.
 */

import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { createServerSupabaseClient } from '@/lib/supabase';
import { parseDocument } from '@/lib/claude';
import type { DocumentType, DocumentStatus } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for processing multiple files

// ============================================================================
// Configuration
// ============================================================================

const ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;
const CFO_INBOX_FOLDER_NAME = 'CFO Inbox';
const CFO_PROCESSED_FOLDER_NAME = 'CFO Processed';

// Supported file types for parsing
const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'text/csv',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'image/png',
  'image/jpeg',
  'image/gif',
];

// ============================================================================
// Google Drive Client
// ============================================================================

function getDriveClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  return google.drive({ version: 'v3', auth: oauth2Client });
}

// ============================================================================
// Folder Management
// ============================================================================

async function ensureFolder(name: string, parentId?: string): Promise<string> {
  const drive = getDriveClient();
  const parent = parentId || ROOT_FOLDER_ID;

  // Check if folder exists
  const query = parent
    ? `name='${name}' and '${parent}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
    : `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

  const { data: existing } = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
  });

  if (existing.files && existing.files.length > 0) {
    return existing.files[0].id!;
  }

  // Create folder
  const { data: folder } = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parent ? [parent] : undefined,
    },
    fields: 'id',
  });

  console.log(`Created folder: ${name} (${folder.id})`);
  return folder.id!;
}

// ============================================================================
// File Operations
// ============================================================================

async function listInboxFiles(): Promise<Array<{
  id: string;
  name: string;
  mimeType: string;
  size: string;
}>> {
  const drive = getDriveClient();

  console.log('=== DRIVE SWEEP DEBUG ===');
  console.log('ROOT_FOLDER_ID:', ROOT_FOLDER_ID);

  const inboxFolderId = await ensureFolder(CFO_INBOX_FOLDER_NAME, ROOT_FOLDER_ID);
  console.log('Found/created CFO Inbox folder ID:', inboxFolderId);

  const query = `'${inboxFolderId}' in parents and trashed=false`;
  console.log('Query:', query);

  const { data } = await drive.files.list({
    q: query,
    fields: 'files(id, name, mimeType, size)',
    orderBy: 'createdTime asc',
    pageSize: 20, // Process up to 20 files per run
  });

  console.log('Files found:', data.files?.length || 0);
  console.log('File names:', data.files?.map(f => f.name));
  console.log('=========================');

  return (data.files || []).map((f) => ({
    id: f.id!,
    name: f.name!,
    mimeType: f.mimeType!,
    size: f.size || '0',
  }));
}

async function downloadFile(fileId: string): Promise<Buffer> {
  const drive = getDriveClient();

  const response = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'stream' }
  );

  const chunks: Buffer[] = [];
  const stream = response.data as Readable;

  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

async function moveFileToProcessed(fileId: string): Promise<void> {
  const drive = getDriveClient();
  const inboxFolderId = await ensureFolder(CFO_INBOX_FOLDER_NAME, ROOT_FOLDER_ID);
  const processedFolderId = await ensureFolder(CFO_PROCESSED_FOLDER_NAME, ROOT_FOLDER_ID);

  // Move file by updating its parents
  await drive.files.update({
    fileId,
    addParents: processedFolderId,
    removeParents: inboxFolderId,
    fields: 'id, parents',
  });
}

// ============================================================================
// Document Processing
// ============================================================================

async function processFile(
  file: { id: string; name: string; mimeType: string },
  supabase: ReturnType<typeof createServerSupabaseClient>
): Promise<{
  success: boolean;
  error?: string;
  documentId?: string;
  questions?: string[];
}> {
  try {
    console.log(`Processing file: ${file.name} (${file.mimeType})`);

    // Check if mime type is supported
    if (!SUPPORTED_MIME_TYPES.includes(file.mimeType)) {
      console.log(`Skipping unsupported file type: ${file.mimeType}`);
      return { success: false, error: `Unsupported file type: ${file.mimeType}` };
    }

    // Download file
    const buffer = await downloadFile(file.id);
    console.log(`Downloaded ${buffer.length} bytes`);

    // Extract text content
    let textContent: string;

    if (file.mimeType === 'application/pdf') {
      // Use unpdf for serverless-compatible PDF parsing
      const { extractText, getDocumentProxy } = await import('unpdf');
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const { text } = await extractText(pdf, { mergePages: true });
      textContent = text || '';
    } else if (file.mimeType === 'text/csv' || file.mimeType === 'text/plain') {
      textContent = buffer.toString('utf-8');
    } else if (file.mimeType.startsWith('image/')) {
      // For images, we note it's an image - could add Vision API later
      textContent = `[Image file: ${file.name}]\n\nImage content will be processed via OCR.`;
    } else if (
      file.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimeType === 'application/vnd.ms-excel'
    ) {
      textContent = `[Excel file: ${file.name}]\n\nExcel parsing not yet implemented. Please export to CSV.`;
    } else {
      textContent = buffer.toString('utf-8');
    }

    // Parse document using Claude
    const parseResult = await parseDocument(textContent, {
      filename: file.name,
      additionalContext: 'This document was automatically ingested from the CFO Inbox folder in Google Drive.',
    });

    // Upload to Supabase storage
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `inbox/${timestamp}_${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, buffer, {
        contentType: file.mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
    }

    // Get entity ID if suggested
    let entityId: string | null = null;
    if (parseResult.suggestedEntity) {
      const { data: entity } = await supabase
        .from('entities')
        .select('id')
        .eq('slug', parseResult.suggestedEntity)
        .single() as { data: { id: string } | null };
      entityId = entity?.id || null;
    }

    // Get account ID if suggested
    let accountId: string | null = null;
    if (parseResult.suggestedAccount && entityId) {
      const { data: account } = await supabase
        .from('accounts')
        .select('id')
        .eq('entity_id', entityId)
        .ilike('name', `%${parseResult.suggestedAccount}%`)
        .single() as { data: { id: string } | null };
      accountId = account?.id || null;
    }

    // Save document record
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        entity_id: entityId,
        account_id: accountId,
        filename: file.name,
        storage_path: uploadError ? '' : storagePath,
        doc_type: parseResult.docType as DocumentType,
        doc_subtype: parseResult.docSubtype,
        source: detectSource(file.name, textContent),
        status: 'parsed' as DocumentStatus,
        parsed_data: {
          raw_text_length: textContent.length,
          source_folder: 'CFO Inbox',
          google_drive_file_id: file.id,
        },
        key_figures: parseResult.keyFigures,
        ai_summary: parseResult.summary,
      })
      .select()
      .single();

    if (docError) {
      console.error('Document save error:', docError);
      return { success: false, error: docError.message };
    }

    // Create proactive queue items for questions
    if (parseResult.questions && parseResult.questions.length > 0) {
      const questions = parseResult.questions.map((q) => ({
        type: 'question' as const,
        priority: 'medium' as const,
        entity_id: entityId,
        message: `[Auto-imported: ${file.name}] ${q}`,
        status: 'open' as const,
      }));

      await supabase.from('proactive_queue').insert(questions);
    }

    // Move file to processed folder
    await moveFileToProcessed(file.id);
    console.log(`Moved ${file.name} to CFO Processed folder`);

    return {
      success: true,
      documentId: document?.id,
      questions: parseResult.questions,
    };
  } catch (error) {
    console.error(`Error processing ${file.name}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function detectSource(filename: string, content: string): string {
  const lowerFilename = filename.toLowerCase();
  const lowerContent = content.toLowerCase();

  // Bank sources
  if (lowerFilename.includes('chase') || lowerContent.includes('chase bank')) return 'chase';
  if (lowerFilename.includes('schwab') || lowerContent.includes('charles schwab')) return 'schwab';
  if (lowerFilename.includes('public') || lowerContent.includes('public.com')) return 'public';

  // Property management
  if (lowerFilename.includes('appfolio') || lowerContent.includes('appfolio')) return 'appfolio';
  if (lowerFilename.includes('satsuma') || lowerContent.includes('satsuma')) return 'satsuma';

  // Mortgage servicers
  if (lowerFilename.includes('rocket') || lowerContent.includes('rocket mortgage')) return 'rocket';
  if (lowerFilename.includes('cooper') || lowerContent.includes('mr. cooper')) return 'mr-cooper';
  if (lowerFilename.includes('dovenmuehle') || lowerContent.includes('dovenmuehle')) return 'dovenmuehle';

  // Insurance
  if (lowerFilename.includes('honeycomb') || lowerContent.includes('honeycomb')) return 'honeycomb';
  if (lowerFilename.includes('fairplan') || lowerContent.includes('la citizens')) return 'la-citizens';

  // Tax documents
  if (lowerFilename.includes('1099') || lowerContent.includes('form 1099')) return 'irs-1099';
  if (lowerFilename.includes('w-2') || lowerFilename.includes('w2') || lowerContent.includes('form w-2')) return 'irs-w2';
  if (lowerFilename.includes('k-1') || lowerFilename.includes('k1') || lowerContent.includes('schedule k-1')) return 'irs-k1';

  return 'google-drive-inbox';
}

// ============================================================================
// Authorization
// ============================================================================

function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // If no secret configured, allow in development
  if (!cronSecret) {
    return process.env.NODE_ENV === 'development';
  }

  return authHeader === `Bearer ${cronSecret}`;
}

// ============================================================================
// API Routes
// ============================================================================

/**
 * GET - Cron job endpoint (called by Vercel scheduler)
 */
export async function GET(request: Request) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return runSweep();
}

/**
 * POST - Manual trigger from dashboard
 * No cron secret required for manual triggers (single-user app)
 */
export async function POST() {
  return runSweep();
}

/**
 * Main sweep function
 */
async function runSweep() {
  const startTime = Date.now();
  console.log('Starting Google Drive inbox sweep...');

  // Check if Google Drive is configured
  if (!ROOT_FOLDER_ID) {
    return NextResponse.json({
      success: false,
      error: 'Google Drive not configured (GOOGLE_DRIVE_FOLDER_ID missing)',
    }, { status: 500 });
  }

  const supabase = createServerSupabaseClient();
  const results: Array<{
    filename: string;
    success: boolean;
    error?: string;
    documentId?: string;
    questions?: string[];
  }> = [];

  try {
    // Ensure folders exist
    await ensureFolder(CFO_INBOX_FOLDER_NAME, ROOT_FOLDER_ID);
    await ensureFolder(CFO_PROCESSED_FOLDER_NAME, ROOT_FOLDER_ID);

    // List files in inbox
    const files = await listInboxFiles();
    console.log(`Found ${files.length} files in CFO Inbox`);

    if (files.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No files to process',
        filesProcessed: 0,
        duration: Date.now() - startTime,
      });
    }

    // Process each file
    for (const file of files) {
      const result = await processFile(file, supabase);
      results.push({
        filename: file.name,
        ...result,
      });

      // Brief pause between files to avoid rate limits
      await new Promise((r) => setTimeout(r, 500));
    }

    // Log sweep completion to notification_log
    await supabase.from('notification_log').insert({
      channel: 'in-app',
      subject: 'Drive Inbox Sweep',
      body_preview: `Processed ${results.length} files from CFO Inbox`,
      sent_at: new Date().toISOString(),
    });

    const successCount = results.filter((r) => r.success).length;
    const errorCount = results.filter((r) => !r.success).length;

    console.log(`Sweep complete: ${successCount} succeeded, ${errorCount} failed`);

    return NextResponse.json({
      success: true,
      filesProcessed: results.length,
      succeeded: successCount,
      failed: errorCount,
      results,
      duration: Date.now() - startTime,
    });
  } catch (error) {
    console.error('Drive sweep error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// Status Endpoint (for dashboard)
// ============================================================================

/**
 * GET /api/cron/drive-sweep/status - Get inbox status
 */
