/**
 * GET /api/documents/:id/details
 * Get document details including signed URL, supplier, and all related parts
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get document with supplier info
    const { data: document, error: docError } = await supabaseAdmin
      .from('documents')
      .select('*, suppliers(*)')
      .eq('id', params.id)
      .single();

    if (docError || !document) {
      logger.error('Document not found', {
        documentId: params.id,
        error: docError?.message,
      });
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Get signed URL for viewing the PDF
    const { data: urlData } = await supabaseAdmin.storage
      .from('supplier-docs')
      .createSignedUrl(document.file_path, 3600);

    // Get all parts linked to this document through part_prices
    const { data: linkedPrices, error: pricesError } = await supabaseAdmin
      .from('part_prices')
      .select('*, parts(*), suppliers(*)')
      .eq('document_id', params.id)
      .order('created_at', { ascending: false });

    if (pricesError) {
      logger.error('Failed to fetch linked parts', {
        documentId: params.id,
        error: pricesError.message,
      });
    }

    // Also check extractions for this document to find additional parts
    const { data: extractions } = await supabaseAdmin
      .from('extractions')
      .select('id, status, normalized_json, created_at')
      .eq('document_id', params.id)
      .order('created_at', { ascending: false });

    // Deduplicate parts (a part might appear multiple times through different price records)
    const partsMap = new Map<string, any>();
    if (linkedPrices) {
      for (const price of linkedPrices) {
        if (price.parts) {
          const existing = partsMap.get(price.parts.id);
          if (!existing) {
            partsMap.set(price.parts.id, {
              ...price.parts,
              price_from_document: {
                unit_price: price.unit_price,
                currency: price.currency,
                moq: price.moq,
                lead_time_days: price.lead_time_days,
                supplier: price.suppliers,
              },
            });
          }
        }
      }
    }

    return NextResponse.json({
      document: {
        id: document.id,
        doc_type: document.doc_type,
        status: document.status,
        created_at: document.created_at,
        supplier: document.suppliers || null,
      },
      signedUrl: urlData?.signedUrl || null,
      relatedParts: Array.from(partsMap.values()),
      extractions: extractions || [],
    });
  } catch (error) {
    logger.error('Document details API error', {
      documentId: params.id,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
