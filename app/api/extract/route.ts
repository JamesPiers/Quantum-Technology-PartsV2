/**
 * POST /api/extract
 * Run extraction service on uploaded document
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { extractRequestSchema } from '@/lib/schemas/api.schema';
import { extractionService } from '@/lib/services/extraction/extraction.service';
import { findOrCreateSupplier } from '@/lib/services/supplier.service';
import { logger } from '@/lib/utils/logger';
import { normalizedExtractionSchema } from '@/lib/schemas/extraction.schema';
import { ZodError } from 'zod';

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

    // Run extraction (providers now validate internally)
    let result;
    try {
      result = await extractionService.extract(
        {
          pdfUrl: urlData.signedUrl,
          supplierId: document.supplier_id,
          documentId: document.id,
        },
        provider
      );
    } catch (extractionError) {
      logger.error('Extraction service failed', {
        documentId,
        provider,
        error: extractionError instanceof Error ? extractionError.message : String(extractionError),
      });

      // Update document status to error
      await supabaseAdmin
        .from('documents')
        .update({ status: 'error' })
        .eq('id', documentId);

      // Check if it's a validation error
      if (extractionError instanceof ZodError) {
        return NextResponse.json(
          {
            error: 'Extraction validation failed',
            details: extractionError.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; '),
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Extraction failed', message: extractionError instanceof Error ? extractionError.message : String(extractionError) },
        { status: 500 }
      );
    }

    // Double-check validation (defensive)
    try {
      normalizedExtractionSchema.parse(result.normalized);
    } catch (validationError) {
      logger.error('Post-extraction validation failed', {
        documentId,
        error: validationError instanceof Error ? validationError.message : String(validationError),
      });
      
      await supabaseAdmin
        .from('documents')
        .update({ status: 'error' })
        .eq('id', documentId);

      if (validationError instanceof ZodError) {
        return NextResponse.json(
          {
            error: 'Extracted data validation failed',
            details: validationError.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; '),
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Invalid extraction data' },
        { status: 500 }
      );
    }

    // Find or create supplier based on extracted supplier name
    let supplierId = document.supplier_id;
    
    if (result.normalized.supplier_name) {
      try {
        supplierId = await findOrCreateSupplier({
          supplierName: result.normalized.supplier_name,
          currency: result.normalized.currency,
        });

        // Update document with the correct supplier_id
        if (supplierId !== document.supplier_id) {
          await supabaseAdmin
            .from('documents')
            .update({ supplier_id: supplierId })
            .eq('id', documentId);

          logger.info('Updated document with supplier', {
            documentId,
            supplierId,
            supplierName: result.normalized.supplier_name,
          });
        }
      } catch (error) {
        logger.error('Failed to find/create supplier', {
          documentId,
          supplierName: result.normalized.supplier_name,
          error: error instanceof Error ? error.message : String(error),
        });
        // Continue with extraction even if supplier matching fails
      }
    }

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
      data: result.normalized,
    });
  } catch (error) {
    logger.error('Extract API error', {
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; '),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

