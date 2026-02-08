import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const { parts } = await request.json();
    
    if (!Array.isArray(parts)) {
      return NextResponse.json(
        { error: 'Invalid data format. Expected array of parts.' },
        { status: 400 }
      );
    }

    let updatedCount = 0;
    const errors = [];

    for (const [index, row] of parts.entries()) {
      try {
        // 1. Parse attributes
        let attributes = {};
        if (typeof row.attributes === 'string') {
            try {
                attributes = JSON.parse(row.attributes);
            } catch (e) {
                logger.warn(`Failed to parse attributes for row ${index}`, { sku: row.sku });
            }
        } else if (typeof row.attributes === 'object') {
            attributes = row.attributes;
        }

        // 2. Prepare part data
        const partData: any = {
            sku: row.sku,
            supplier_part_number: row.supplier_part_number,
            name: row.name,
            description: row.description,
            // Handle empty strings as null for optional fields
            manufacturer_id: row.manufacturer_id || null, 
            catalog_code: row.catalog_code || null,
            sub_catalog_code: row.sub_catalog_code || null,
            drawing_url: row.drawing_url || null,
            attributes: attributes
        };

        // 3. Upsert Part
        let partId = row.id;
        let partOperation;

        if (partId) {
            // Update existing by ID
            partOperation = supabaseAdmin
                .from('parts')
                .upsert({ id: partId, ...partData })
                .select()
                .single();
        } else {
            // Insert or Update by SKU
            // Note: SKU must be unique in DB
            partOperation = supabaseAdmin
                .from('parts')
                .upsert(partData, { onConflict: 'sku' })
                .select()
                .single();
        }

        const { data: part, error: partError } = await partOperation;

        if (partError) {
            throw new Error(`Part Upsert Error: ${partError.message}`);
        }
        partId = part.id;

        // 4. Handle Price
        // Only insert price if unit_price is provided and valid
        if (row.unit_price && row.supplier_id) {
            const unitPrice = parseFloat(row.unit_price);
            
            if (!isNaN(unitPrice)) {
                const { error: priceError } = await supabaseAdmin
                    .from('part_prices')
                    .insert({
                        part_id: partId,
                        supplier_id: row.supplier_id,
                        unit_price: unitPrice,
                        currency: row.currency || 'USD',
                        moq: row.moq ? parseInt(row.moq) : null,
                        lead_time_days: row.lead_time_days ? parseInt(row.lead_time_days) : null,
                        valid_from: new Date().toISOString()
                    });
                
                if (priceError) {
                    logger.warn(`Failed to update price for part ${part.sku}`, { error: priceError.message });
                }
            }
        }

        updatedCount++;
      } catch (err) {
        logger.error(`Error processing row ${index}`, { error: err instanceof Error ? err : String(err) });
        errors.push({ row: index, error: err instanceof Error ? err.message : String(err) });
      }
    }

    return NextResponse.json({ 
        count: updatedCount, 
        errors: errors.length > 0 ? errors : undefined 
    });

  } catch (error) {
    logger.error('Batch update error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

