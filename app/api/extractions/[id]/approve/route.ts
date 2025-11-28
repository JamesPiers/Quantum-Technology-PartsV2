/**
 * POST /api/extractions/:id/approve
 * Approve extraction and create parts & part_prices from normalized data
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';
import { NormalizedExtraction } from '@/lib/types/database.types';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const extractionId = params.id;

    // Get extraction data
    const { data: extraction, error: extractionError } = await supabaseAdmin
      .from('extractions')
      .select('*, documents(supplier_id)')
      .eq('id', extractionId)
      .single();

    if (extractionError || !extraction) {
      logger.error('Extraction not found', {
        extractionId,
        error: extractionError?.message,
      });
      return NextResponse.json(
        { error: 'Extraction not found' },
        { status: 404 }
      );
    }

    const normalized = extraction.normalized_json as NormalizedExtraction;
    const supplierId = (extraction.documents as any).supplier_id;

    let partsCreated = 0;
    let pricesCreated = 0;

    // Process each line item
    for (const item of normalized.line_items) {
      // Generate SKU from supplier part number (you may want a more sophisticated SKU generation)
      const sku = `SKU-${item.supplier_part_number}`;

      // Upsert part
      const { data: part, error: partError } = await supabaseAdmin
        .from('parts')
        .upsert(
          {
            sku,
            supplier_part_number: item.supplier_part_number,
            name: item.description,
            description: item.description,
            attributes: {
              uom: item.uom,
              moq: item.moq,
              lead_time_days: item.lead_time_days,
            },
          },
          {
            onConflict: 'sku',
            ignoreDuplicates: false,
          }
        )
        .select()
        .single();

      if (partError) {
        logger.error('Failed to upsert part', {
          extractionId,
          supplierPartNumber: item.supplier_part_number,
          error: partError.message,
        });
        continue;
      }

      partsCreated++;

      // Create part_prices for each quantity break
      for (const qtyBreak of item.qty_breaks) {
        const validFrom = normalized.quote_date || new Date().toISOString().split('T')[0];
        const validThrough = normalized.valid_until;

        const { error: priceError } = await supabaseAdmin
          .from('part_prices')
          .insert({
            part_id: part.id,
            supplier_id: supplierId,
            currency: normalized.currency || 'USD',
            unit_price: qtyBreak.unit_price,
            moq: qtyBreak.min_qty,
            lead_time_days: item.lead_time_days,
            valid_from: validFrom,
            valid_through: validThrough,
            document_id: extraction.document_id,
            extraction_id: extractionId,
          });

        if (priceError) {
          logger.error('Failed to create part price', {
            extractionId,
            partId: part.id,
            error: priceError.message,
          });
          continue;
        }

        pricesCreated++;
      }
    }

    // Update extraction status to approved
    const { error: updateError } = await supabaseAdmin
      .from('extractions')
      .update({ status: 'approved' })
      .eq('id', extractionId);

    if (updateError) {
      logger.error('Failed to update extraction status', {
        extractionId,
        error: updateError.message,
      });
    }

    logger.info('Extraction approved', {
      extractionId,
      partsCreated,
      pricesCreated,
    });

    return NextResponse.json({
      success: true,
      partsCreated,
      pricesCreated,
    });
  } catch (error) {
    logger.error('Approve API error', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

