/**
 * CPA Packet API Route
 *
 * POST /api/cpa-packet - Generate CPA packet PDF
 *
 * Request body:
 * - taxYear: number (required)
 * - partnerId: string (optional) - Partner to prepare for
 * - uploadToDrive: boolean (optional) - Upload to Google Drive
 *
 * Response:
 * - If uploadToDrive: { success: true, driveUrl: string, filename: string }
 * - If not uploadToDrive: PDF file download
 */

import { NextResponse } from 'next/server';
import { renderToBuffer, DocumentProps } from '@react-pdf/renderer';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { CPAPacketDocument, aggregateCPAPacketData } from '@/lib/pdf';
import type { ReactElement } from 'react';

export const runtime = 'nodejs';
export const maxDuration = 60; // Allow up to 60 seconds for PDF generation

// ============================================================================
// Google Drive Helper
// ============================================================================

const CPA_PACKETS_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

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

async function ensurePacketsFolder(): Promise<string> {
  const drive = getDriveClient();

  // Check if CPA Packets folder exists
  const { data: existing } = await drive.files.list({
    q: `name='CPA Packets' and '${CPA_PACKETS_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
  });

  if (existing.files && existing.files.length > 0) {
    return existing.files[0].id!;
  }

  // Create CPA Packets folder
  const { data: folder } = await drive.files.create({
    requestBody: {
      name: 'CPA Packets',
      mimeType: 'application/vnd.google-apps.folder',
      parents: CPA_PACKETS_FOLDER_ID ? [CPA_PACKETS_FOLDER_ID] : undefined,
    },
    fields: 'id',
  });

  return folder.id!;
}

async function uploadPDFToDrive(
  buffer: Buffer,
  filename: string
): Promise<{ id: string; webViewLink: string }> {
  const drive = getDriveClient();
  const folderId = await ensurePacketsFolder();

  // Check if file exists (to update instead of create duplicate)
  const { data: existing } = await drive.files.list({
    q: `name='${filename}' and '${folderId}' in parents and trashed=false`,
    fields: 'files(id)',
  });

  let fileId: string;

  // Convert buffer to readable stream
  const stream = Readable.from(buffer);

  if (existing.files && existing.files.length > 0) {
    // Update existing file
    fileId = existing.files[0].id!;
    await drive.files.update({
      fileId,
      media: {
        mimeType: 'application/pdf',
        body: stream,
      },
    });
  } else {
    // Create new file
    const { data: file } = await drive.files.create({
      requestBody: {
        name: filename,
        parents: [folderId],
      },
      media: {
        mimeType: 'application/pdf',
        body: stream,
      },
      fields: 'id',
    });
    fileId = file.id!;
  }

  // Get web view link
  const { data: fileInfo } = await drive.files.get({
    fileId,
    fields: 'webViewLink',
  });

  return {
    id: fileId,
    webViewLink: fileInfo.webViewLink || '',
  };
}

// ============================================================================
// POST /api/cpa-packet - Generate PDF
// ============================================================================

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { taxYear, partnerId, uploadToDrive = false } = body;

    // Validate tax year
    const year = taxYear || new Date().getFullYear();
    if (year < 2020 || year > 2030) {
      return NextResponse.json(
        { error: 'Invalid tax year' },
        { status: 400 }
      );
    }

    console.log(`Generating CPA packet for tax year ${year}...`);

    // Aggregate all data
    const packetData = await aggregateCPAPacketData(year, partnerId);

    console.log('Data aggregated, rendering PDF...');

    // Generate PDF - CPAPacketDocument returns a Document element
    // Cast to the expected type for renderToBuffer
    const pdfDocument = CPAPacketDocument({ data: packetData });
    const pdfBuffer = await renderToBuffer(
      pdfDocument as unknown as ReactElement<DocumentProps>
    );

    const filename = `CPA-Packet-${year}-${new Date().toISOString().slice(0, 10)}.pdf`;

    console.log(`PDF generated: ${filename} (${pdfBuffer.length} bytes)`);

    if (uploadToDrive) {
      // Upload to Google Drive
      console.log('Uploading to Google Drive...');
      const { webViewLink } = await uploadPDFToDrive(Buffer.from(pdfBuffer), filename);

      return NextResponse.json({
        success: true,
        driveUrl: webViewLink,
        filename,
        taxYear: year,
        preparedFor: packetData.preparedFor,
      });
    } else {
      // Return as downloadable PDF
      // Convert NodeJS.ArrayBufferView to Uint8Array for NextResponse compatibility
      const uint8Array = new Uint8Array(pdfBuffer);
      return new NextResponse(uint8Array, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': pdfBuffer.length.toString(),
        },
      });
    }
  } catch (error) {
    console.error('CPA Packet generation error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate CPA packet',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/cpa-packet - Get available options
// ============================================================================

export async function GET() {
  const currentYear = new Date().getFullYear();

  return NextResponse.json({
    availableTaxYears: Array.from({ length: 6 }, (_, i) => currentYear - i),
    driveConfigured: !!process.env.GOOGLE_DRIVE_FOLDER_ID,
    description: 'Generate a professionally designed CPA packet PDF with entity summaries, document checklists, tax strategies, and open questions.',
  });
}
