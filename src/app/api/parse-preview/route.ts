/**
 * Document Parse Preview API
 *
 * POST /api/parse-preview - Parse document and return results for review
 *
 * Unlike /api/parse, this does NOT save to knowledge base automatically.
 * Returns parsed data for user to review and confirm.
 */

import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { parseDocument } from '@/lib/claude';
import type { DocumentType, DocumentStatus } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const entityHint = formData.get('entityHint') as string | null;
    const userNote = formData.get('note') as string | null;

    if (!file) {
      return Response.json({ error: 'File is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const filename = file.name;
    const fileType = file.type;

    // Extract text content from file
    let textContent: string;
    let extractionMethod = 'text';

    if (fileType === 'application/pdf') {
      try {
        const { extractText, getDocumentProxy } = await import('unpdf');
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await getDocumentProxy(new Uint8Array(arrayBuffer));
        const { text } = await extractText(pdf, { mergePages: true });
        textContent = text || '';
        extractionMethod = 'unpdf';

        if (!textContent.trim()) {
          textContent = `[PDF file: ${filename}]\n\nPDF parsed but no text found. May be a scanned document.`;
          extractionMethod = 'unpdf-empty';
        }
      } catch (pdfError) {
        console.error('PDF parse error:', pdfError);
        textContent = `[PDF file: ${filename}]\n\nPDF extraction failed.`;
        extractionMethod = 'unpdf-failed';
      }
    } else if (fileType === 'text/csv' || fileType === 'text/plain') {
      textContent = await file.text();
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      fileType === 'application/vnd.ms-excel'
    ) {
      textContent = `[Excel file: ${filename}]\n\nExcel parsing not yet implemented. Please export to CSV.`;
      extractionMethod = 'excel-unsupported';
    } else {
      try {
        textContent = await file.text();
      } catch {
        return Response.json({ error: `Unsupported file type: ${fileType}` }, { status: 400 });
      }
    }

    // Parse document using Claude
    const parseResult = await parseDocument(textContent, {
      filename,
      entityHint: entityHint || undefined,
      additionalContext: userNote || undefined,
    });

    // Get entity info if suggested
    let entityInfo = null;
    if (parseResult.suggestedEntity) {
      const { data: entity } = await supabase
        .from('entities')
        .select('id, slug, name')
        .eq('slug', parseResult.suggestedEntity)
        .single();
      entityInfo = entity;
    }

    // Upload file to temp storage (will be moved to permanent on confirm)
    const timestamp = Date.now();
    const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const tempPath = `temp/${timestamp}_${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(tempPath, file, {
        contentType: fileType,
        upsert: false,
      });

    if (uploadError) {
      console.error('Temp storage upload error:', uploadError);
    }

    // Return parsed data for review (NOT saved to knowledge yet)
    return Response.json({
      success: true,
      preview: {
        filename,
        fileType,
        fileSize: file.size,
        tempPath: uploadError ? null : tempPath,
        extractionMethod,
        textLength: textContent.length,
      },
      parsed: {
        summary: parseResult.summary,
        docType: parseResult.docType,
        docSubtype: parseResult.docSubtype,
        keyFigures: parseResult.keyFigures,
        suggestedEntity: parseResult.suggestedEntity,
        suggestedAccount: parseResult.suggestedAccount,
        questions: parseResult.questions,
      },
      entity: entityInfo,
    });
  } catch (error) {
    console.error('Parse preview error:', error);
    return Response.json(
      { error: 'Failed to parse document', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/parse-preview - Confirm and save parsed document
 *
 * Called after user reviews and approves the parsed data.
 * Saves document record and extracts knowledge.
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      filename,
      tempPath,
      docType,
      docSubtype,
      keyFigures,
      summary,
      entitySlug,
      accountName,
      userEdits,
    } = body;

    if (!filename) {
      return Response.json({ error: 'filename is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Merge user edits with parsed key figures
    const finalKeyFigures = { ...keyFigures, ...userEdits };

    // Get entity ID
    let entityId: string | null = null;
    if (entitySlug) {
      const { data: entity } = await supabase
        .from('entities')
        .select('id')
        .eq('slug', entitySlug)
        .single();
      entityId = entity?.id || null;
    }

    // Get account ID
    let accountId: string | null = null;
    if (accountName && entityId) {
      const { data: account } = await supabase
        .from('accounts')
        .select('id')
        .eq('entity_id', entityId)
        .ilike('name', `%${accountName}%`)
        .single();
      accountId = account?.id || null;
    }

    // Move file from temp to permanent storage
    let permanentPath = '';
    if (tempPath) {
      const timestamp = Date.now();
      const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
      permanentPath = `confirmed/${timestamp}_${safeName}`;

      // Copy to permanent location
      const { data: fileData } = await supabase.storage.from('documents').download(tempPath);
      if (fileData) {
        await supabase.storage.from('documents').upload(permanentPath, fileData);
        // Delete temp file
        await supabase.storage.from('documents').remove([tempPath]);
      }
    }

    // Save document record
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        entity_id: entityId,
        account_id: accountId,
        filename,
        storage_path: permanentPath,
        doc_type: docType as DocumentType,
        doc_subtype: docSubtype,
        source: 'chat-upload',
        status: 'confirmed' as DocumentStatus,
        parsed_data: { confirmed_by_user: true },
        key_figures: finalKeyFigures,
        ai_summary: summary,
      })
      .select()
      .single();

    if (docError) {
      console.error('Document save error:', docError);
      return Response.json({ error: 'Failed to save document' }, { status: 500 });
    }

    // Extract knowledge from confirmed key figures
    const { extractKnowledgeFromDocument } = await import('@/lib/knowledge-extractor');
    const knowledgeResult = await extractKnowledgeFromDocument({
      documentId: document.id,
      entitySlug,
      docType,
      keyFigures: finalKeyFigures,
      aiSummary: summary,
    });

    return Response.json({
      success: true,
      document,
      knowledge: knowledgeResult,
    });
  } catch (error) {
    console.error('Confirm document error:', error);
    return Response.json(
      { error: 'Failed to confirm document', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
