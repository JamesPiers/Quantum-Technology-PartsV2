/**
 * POST /api/extract
 * Run extraction service on uploaded document
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { extractRequestSchema } from '@/lib/schemas/api.schema';
import { extractionService } from '@/lib/services/extraction/extraction.service';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = extractRequestSchema.parse(body);

    const { documentId, provider } = validated;

    // Get document details
    const { data: document, error: docError } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      logger.error('Document not found', {
        documentId,
        error: docError?.message,
      });
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Update document status to processing
    await supabaseAdmin
      .from('documents')
      .update({ status: 'processing' })
      .eq('id', documentId);

    // Get signed URL for the uploaded file
    const { data: urlData } = await supabaseAdmin.storage
      .from('supplier-docs')
      .createSignedUrl(document.file_path, 3600); // 1 hour expiry

    if (!urlData?.signedUrl) {
      logger.error('Failed to get signed URL for document', { documentId });
      return NextResponse.json(
        { error: 'Failed to access document' },
        { status: 500 }
      );
    }

    // Run extraction
    const result = await extractionService.extract(
      {
        pdfUrl: urlData.signedUrl,
        supplierId: document.supplier_id,
        documentId: document.id,
      },
      provider
    );

    // Save extraction results
    const { data: extraction, error: extractionError } = await supabaseAdmin
      .from('extractions')
      .insert({
        document_id: documentId,
        provider: provider || extractionService.getDefaultProvider(),
        raw_json: result.raw,
        normalized_json: result.normalized,
        accuracy: result.metrics,
        status: 'pending_review',
      })
      .select()
      .single();

    if (extractionError) {
      logger.error('Failed to save extraction', {
        documentId,
        error: extractionError.message,
      });

      // Update document status to error
      await supabaseAdmin
        .from('documents')
        .update({ status: 'error' })
        .eq('id', documentId);

      return NextResponse.json(
        { error: 'Failed to save extraction results' },
        { status: 500 }
      );
    }

    // Update document status to completed
    await supabaseAdmin
      .from('documents')
      .update({ status: 'completed' })
      .eq('id', documentId);

    logger.info('Extraction completed', {
      documentId,
      extractionId: extraction.id,
      lineItemsCount: result.normalized.line_items.length,
    });

    return NextResponse.json({
      extractionId: extraction.id,
      status: 'pending_review',
    });
  } catch (error) {
    logger.error('Extract API error', {
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

