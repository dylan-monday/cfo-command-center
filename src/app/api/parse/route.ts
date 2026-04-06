/**
 * Document Parse API Route
 *
 * POST /api/parse - Parse an uploaded document using Claude
 *
 * Accepts file uploads, extracts text, and uses Claude to identify
 * document type, extract key figures, and suggest entity/account matches.
 */

import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { parseDocument } from '@/lib/claude';
import type { DocumentType, DocumentStatus } from '@/types';

// ============================================================================
// POST - Parse Document
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const entityHint = formData.get('entityHint') as string | null;
    const accountHint = formData.get('accountHint') as string | null;
    const additionalContext = formData.get('context') as string | null;

    if (!file) {
      return Response.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Extract text content from file
    let textContent: string;
    const fileType = file.type;
    const filename = file.name;

    if (fileType === 'application/pdf') {
      // For PDFs, we'll need to extract text using pdf-parse v2 API
      try {
        const { PDFParse } = await import('pdf-parse');
        const buffer = Buffer.from(await file.arrayBuffer());
        // PDFParse v2 constructor takes options object with data property
        const pdfParser = new PDFParse({ data: buffer });
        const textResult = await pdfParser.getText();
        // Combine text from all pages
        textContent = textResult.pages?.map((p) => p.text).join('\n\n') || textResult.text || '';
        // Clean up
        await pdfParser.destroy();
      } catch (pdfError) {
        console.error('PDF parse error:', pdfError);
        // Fall back to noting it's a PDF we couldn't parse
        textContent = `[PDF file: ${filename}]\n\nPDF text extraction failed. The document has been uploaded but could not be parsed automatically.`;
      }
    } else if (fileType === 'text/csv') {
      // CSV files - read as text
      textContent = await file.text();
    } else if (fileType === 'text/plain') {
      // Plain text
      textContent = await file.text();
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      fileType === 'application/vnd.ms-excel'
    ) {
      // Excel files - for now, just note it's an Excel file
      // Full parsing would require xlsx package
      textContent = `[Excel file: ${filename}]\n\nExcel parsing not yet implemented. Please export to CSV.`;
    } else if (fileType.startsWith('image/')) {
      // Images - we could use Claude's vision capabilities
      // For now, note it's an image
      textContent = `[Image file: ${filename}]\n\nImage OCR not yet implemented.`;
    } else {
      // Try to read as text
      try {
        textContent = await file.text();
      } catch {
        return Response.json(
          { error: `Unsupported file type: ${fileType}` },
          { status: 400 }
        );
      }
    }

    // Parse document using Claude
    const parseResult = await parseDocument(textContent, {
      filename,
      entityHint: entityHint || undefined,
      accountHint: accountHint || undefined,
      additionalContext: additionalContext || undefined,
    });

    // Upload file to storage
    const timestamp = Date.now();
    const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `uploads/${timestamp}_${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, file, {
        contentType: fileType,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      // Continue without storage - document can still be processed
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
        filename,
        storage_path: uploadError ? '' : storagePath,
        doc_type: parseResult.docType as DocumentType,
        doc_subtype: parseResult.docSubtype,
        source: detectSource(filename, textContent),
        status: 'parsed' as DocumentStatus,
        parsed_data: { raw_text_length: textContent.length },
        key_figures: parseResult.keyFigures,
        ai_summary: parseResult.summary,
      })
      .select()
      .single();

    if (docError) {
      console.error('Document save error:', docError);
    }

    // If there are questions, create proactive queue items
    if (parseResult.questions && parseResult.questions.length > 0) {
      const questions = parseResult.questions.map((q) => ({
        type: 'question' as const,
        priority: 'medium' as const,
        entity_id: entityId,
        message: `[Document: ${filename}] ${q}`,
        status: 'open' as const,
      }));

      await supabase.from('proactive_queue').insert(questions);
    }

    return Response.json({
      success: true,
      document: document || null,
      parseResult: {
        summary: parseResult.summary,
        docType: parseResult.docType,
        docSubtype: parseResult.docSubtype,
        keyFigures: parseResult.keyFigures,
        suggestedEntity: parseResult.suggestedEntity,
        suggestedAccount: parseResult.suggestedAccount,
        questions: parseResult.questions,
      },
    });
  } catch (error) {
    console.error('Parse API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Detect document source from filename or content patterns.
 */
function detectSource(filename: string, content: string): string {
  const lowerFilename = filename.toLowerCase();
  const lowerContent = content.toLowerCase();

  // Bank sources
  if (lowerFilename.includes('chase') || lowerContent.includes('chase bank')) {
    return 'chase';
  }
  if (lowerFilename.includes('schwab') || lowerContent.includes('charles schwab')) {
    return 'schwab';
  }
  if (lowerFilename.includes('public') || lowerContent.includes('public.com')) {
    return 'public';
  }

  // Property management
  if (lowerFilename.includes('appfolio') || lowerContent.includes('appfolio')) {
    return 'appfolio';
  }
  if (lowerFilename.includes('satsuma') || lowerContent.includes('satsuma')) {
    return 'satsuma';
  }

  // Mortgage servicers
  if (lowerFilename.includes('rocket') || lowerContent.includes('rocket mortgage')) {
    return 'rocket';
  }
  if (lowerFilename.includes('cooper') || lowerContent.includes('mr. cooper')) {
    return 'mr-cooper';
  }
  if (lowerFilename.includes('dovenmuehle') || lowerContent.includes('dovenmuehle')) {
    return 'dovenmuehle';
  }

  // Insurance
  if (lowerFilename.includes('honeycomb') || lowerContent.includes('honeycomb')) {
    return 'honeycomb';
  }
  if (lowerFilename.includes('fairplan') || lowerContent.includes('la citizens')) {
    return 'la-citizens';
  }

  // Tax documents
  if (lowerFilename.includes('1099') || lowerContent.includes('form 1099')) {
    return 'irs-1099';
  }
  if (lowerFilename.includes('w-2') || lowerFilename.includes('w2') || lowerContent.includes('form w-2')) {
    return 'irs-w2';
  }
  if (lowerFilename.includes('k-1') || lowerFilename.includes('k1') || lowerContent.includes('schedule k-1')) {
    return 'irs-k1';
  }

  return 'unknown';
}

// ============================================================================
// PATCH - Re-parse Existing Document
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const { documentId } = await request.json();

    if (!documentId) {
      return Response.json(
        { error: 'documentId is required' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Fetch the document record
    const { data: doc, error: fetchError } = await supabase
      .from('documents')
      .select('*, entities!left(slug)')
      .eq('id', documentId)
      .single();

    if (fetchError || !doc) {
      return Response.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    if (!doc.storage_path) {
      return Response.json(
        { error: 'Document has no stored file to re-parse' },
        { status: 400 }
      );
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(doc.storage_path);

    if (downloadError || !fileData) {
      console.error('Storage download error:', downloadError);
      return Response.json(
        { error: 'Failed to download file from storage' },
        { status: 500 }
      );
    }

    // Determine file type from filename
    const filename = doc.filename || 'unknown';
    const ext = filename.split('.').pop()?.toLowerCase();
    let textContent: string;

    if (ext === 'pdf') {
      // PDF parsing with pdf-parse v2 API
      try {
        const { PDFParse } = await import('pdf-parse');
        const buffer = Buffer.from(await fileData.arrayBuffer());
        const pdfParser = new PDFParse({ data: buffer });
        const textResult = await pdfParser.getText();
        textContent = textResult.pages?.map((p) => p.text).join('\n\n') || textResult.text || '';
        await pdfParser.destroy();
      } catch (pdfError) {
        console.error('PDF parse error:', pdfError);
        textContent = `[PDF file: ${filename}]\n\nPDF text extraction failed during re-parse.`;
      }
    } else if (ext === 'csv' || ext === 'txt') {
      textContent = await fileData.text();
    } else if (ext === 'xlsx' || ext === 'xls') {
      textContent = `[Excel file: ${filename}]\n\nExcel parsing not yet implemented. Please export to CSV.`;
    } else {
      // Try to read as text
      try {
        textContent = await fileData.text();
      } catch {
        textContent = `[File: ${filename}]\n\nCould not extract text content.`;
      }
    }

    // Re-parse document using Claude
    const entitySlug = doc.entities?.slug;
    const parseResult = await parseDocument(textContent, {
      filename,
      entityHint: entitySlug || undefined,
    });

    // Get entity ID if suggested (and different from current)
    let entityId: string | null = doc.entity_id;
    if (parseResult.suggestedEntity && parseResult.suggestedEntity !== entitySlug) {
      const { data: entity } = await supabase
        .from('entities')
        .select('id')
        .eq('slug', parseResult.suggestedEntity)
        .single() as { data: { id: string } | null };
      if (entity) {
        entityId = entity.id;
      }
    }

    // Get account ID if suggested
    let accountId: string | null = doc.account_id;
    if (parseResult.suggestedAccount && entityId) {
      const { data: account } = await supabase
        .from('accounts')
        .select('id')
        .eq('entity_id', entityId)
        .ilike('name', `%${parseResult.suggestedAccount}%`)
        .single() as { data: { id: string } | null };
      if (account) {
        accountId = account.id;
      }
    }

    // Update document record
    const { data: updatedDoc, error: updateError } = await supabase
      .from('documents')
      .update({
        entity_id: entityId,
        account_id: accountId,
        doc_type: parseResult.docType as DocumentType,
        doc_subtype: parseResult.docSubtype,
        source: detectSource(filename, textContent),
        status: 'parsed' as DocumentStatus,
        parsed_data: { raw_text_length: textContent.length, reparsed_at: new Date().toISOString() },
        key_figures: parseResult.keyFigures,
        ai_summary: parseResult.summary,
      })
      .eq('id', documentId)
      .select()
      .single();

    if (updateError) {
      console.error('Document update error:', updateError);
      return Response.json(
        { error: 'Failed to update document record' },
        { status: 500 }
      );
    }

    // If there are new questions, create proactive queue items
    if (parseResult.questions && parseResult.questions.length > 0) {
      const questions = parseResult.questions.map((q) => ({
        type: 'question' as const,
        priority: 'medium' as const,
        entity_id: entityId,
        message: `[Re-parsed: ${filename}] ${q}`,
        status: 'open' as const,
      }));

      await supabase.from('proactive_queue').insert(questions);
    }

    return Response.json({
      success: true,
      document: updatedDoc,
      parseResult: {
        summary: parseResult.summary,
        docType: parseResult.docType,
        docSubtype: parseResult.docSubtype,
        keyFigures: parseResult.keyFigures,
        suggestedEntity: parseResult.suggestedEntity,
        suggestedAccount: parseResult.suggestedAccount,
        questions: parseResult.questions,
      },
    });
  } catch (error) {
    console.error('Re-parse API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - List Documents
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entitySlug = searchParams.get('entity');
    const docType = searchParams.get('type');
    const status = searchParams.get('status');
    const taxYear = searchParams.get('taxYear');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = createServerSupabaseClient();

    // Build query
    let query = supabase
      .from('documents')
      .select('*, entities!left(slug, name), accounts!left(name)', { count: 'exact' });

    // Filter by entity
    if (entitySlug) {
      const { data: entity } = await supabase
        .from('entities')
        .select('id')
        .eq('slug', entitySlug)
        .single() as { data: { id: string } | null };

      if (entity) {
        query = query.eq('entity_id', entity.id);
      }
    }

    // Filter by type
    if (docType) {
      query = query.eq('doc_type', docType);
    }

    // Filter by status
    if (status) {
      query = query.eq('status', status);
    }

    // Filter by tax year
    if (taxYear) {
      query = query.eq('tax_year', parseInt(taxYear));
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      documents: data,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    console.error('GET documents error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
