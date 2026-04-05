/**
 * Drive Sweep Status API
 *
 * GET /api/cron/drive-sweep/status - Get inbox file count and last sweep info
 */

import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createServerSupabaseClient } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;
const CFO_INBOX_FOLDER_NAME = 'CFO Inbox';

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

async function getInboxFolderId(): Promise<string | null> {
  if (!ROOT_FOLDER_ID) return null;

  const drive = getDriveClient();
  const query = `name='${CFO_INBOX_FOLDER_NAME}' and '${ROOT_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;

  const { data } = await drive.files.list({
    q: query,
    fields: 'files(id)',
  });

  return data.files?.[0]?.id || null;
}

async function countInboxFiles(folderId: string): Promise<number> {
  const drive = getDriveClient();

  const { data } = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: 'files(id)',
    pageSize: 100,
  });

  return data.files?.length || 0;
}

export async function GET() {
  try {
    // Check if Google Drive is configured
    if (!ROOT_FOLDER_ID) {
      return NextResponse.json({
        configured: false,
        inboxCount: 0,
        lastSweep: null,
        message: 'Google Drive not configured',
      });
    }

    const supabase = createServerSupabaseClient();

    // Get inbox folder and count files
    let inboxCount = 0;
    let folderExists = false;

    try {
      const folderId = await getInboxFolderId();
      if (folderId) {
        folderExists = true;
        inboxCount = await countInboxFiles(folderId);
      }
    } catch (driveError) {
      console.error('Drive API error:', driveError);
    }

    // Get last sweep timestamp from notification_log
    const { data: lastSweepLog } = await supabase
      .from('notification_log')
      .select('sent_at, body_preview')
      .eq('subject', 'Drive Inbox Sweep')
      .order('sent_at', { ascending: false })
      .limit(1)
      .single();

    // Get recent documents from inbox source
    const { data: recentDocs, count: totalInboxDocs } = await supabase
      .from('documents')
      .select('filename, created_at, ai_summary', { count: 'exact' })
      .contains('parsed_data', { source_folder: 'CFO Inbox' })
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      configured: true,
      folderExists,
      inboxCount,
      lastSweep: lastSweepLog?.sent_at || null,
      lastSweepResult: lastSweepLog?.body_preview || null,
      totalProcessed: totalInboxDocs || 0,
      recentDocuments: recentDocs || [],
    });
  } catch (error) {
    console.error('Status API error:', error);
    return NextResponse.json(
      {
        configured: false,
        inboxCount: 0,
        lastSweep: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
