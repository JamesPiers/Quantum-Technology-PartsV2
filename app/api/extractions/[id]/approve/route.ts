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

    // Parse request body if available
    let body: any = {};
    try {
      body = await request.json();
    } catch (e) {
      // Body might be empty if called without payload (legacy/default)
    }

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
    
    // Use line items from body if available, otherwise fallback to normalized extraction
    const lineItems = body.lineItems || normalized.line_items;
    
    // Use supplier info from body if available for defaults
    const supplierInfo = body.supplierInfo || {};
    const defaultCurrency = supplierInfo.currency || normalized.currency || 'USD';
    const defaultQuoteDate = supplierInfo.quote_date || normalized.quote_date || new Date().toISOString().split('T')[0];
    const defaultValidUntil = supplierInfo.valid_until || normalized.valid_until;

    let partsCreated = 0;
    let pricesCreated = 0;

    // Process each line item
    for (const item of lineItems) {
      // Generate SKU from supplier part number or use provided SKU
      const sku = item.sku || `SKU-${item.supplier_part_number}`;

      // Prepare attributes - merge standard fields with catalog attributes
      const attributes = {
        ...(item.attributes || {}),
        uom: item.uom,
        moq: item.moq,
        lead_time_days: item.lead_time_days,
      };

      // Upsert part
      const { data: part, error: partError } = await supabaseAdmin
        .from('parts')
        .upsert(
          {
            sku,
            supplier_part_number: item.supplier_part_number,
            name: item.description,
            description: item.description,
            manufacturer_id: item.manufacturer_id || null,
            catalog_code: item.catalog_code || null,
            sub_catalog_code: item.sub_catalog_code || null,
            attributes: attributes,
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
      const qtyBreaks = item.qty_breaks || [];
      for (const qtyBreak of qtyBreaks) {
        const { error: priceError } = await supabaseAdmin
          .from('part_prices')
          .insert({
            part_id: part.id,
            supplier_id: supplierId,
            currency: defaultCurrency,
            unit_price: qtyBreak.unit_price,
            moq: qtyBreak.min_qty,
            lead_time_days: item.lead_time_days,
            valid_from: defaultQuoteDate,
            valid_through: defaultValidUntil,
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
    // Also update the normalized_json with the approved data so we have a record of what was actually imported
    const updatedNormalized = {
      ...normalized,
      line_items: lineItems,
      ...(Object.keys(supplierInfo).length > 0 ? supplierInfo : {})
    };

    const { error: updateError } = await supabaseAdmin
      .from('extractions')
      .update({ 
        status: 'approved',
        normalized_json: updatedNormalized 
      })
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
