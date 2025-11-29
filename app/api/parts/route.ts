/**
 * GET /api/parts - List parts with optional search
 * POST /api/parts - Create new part
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { createPartSchema } from '@/lib/schemas/api.schema';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabaseAdmin
      .from('parts')
      .select('*, part_prices(*)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Add search filter if provided
    if (search) {
      query = query.or(
        `sku.ilike.%${search}%,supplier_part_number.ilike.%${search}%,name.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch parts', { error: error.message });
      return NextResponse.json(
        { error: 'Failed to fetch parts' },
        { status: 500 }
      );
    }

    // Process parts to include current_price
    const now = new Date().toISOString().split('T')[0];
    const partsWithPrices = data.map((part: any) => {
      const prices = part.part_prices || [];
      // Sort prices by created_at desc to get most recent first
      prices.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      const currentPrice = prices.find((price: any) => {
        const validFrom = price.valid_from;
        const validThrough = price.valid_through;
        return (
          validFrom <= now &&
          (validThrough === null || validThrough >= now)
        );
      }) || prices[0]; // Fall back to most recent

      return {
        ...part,
        prices,
        current_price: currentPrice
      };
    });

    return NextResponse.json({
      data: partsWithPrices,
      count,
      limit,
      offset,
    });
  } catch (error) {
    logger.error('Parts GET API error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createPartSchema.parse(body);

    const { initial_price, document_id, ...partData } = validated;

    // 1. Create Part
    const { data: part, error: partError } = await supabaseAdmin
      .from('parts')
      .insert(partData)
      .select()
      .single();

    if (partError) {
      logger.error('Failed to create part', { error: partError.message });
      return NextResponse.json(
        { error: 'Failed to create part' },
        { status: 500 }
      );
    }

    // 2. Create Price (if provided)
    if (initial_price) {
      const { error: priceError } = await supabaseAdmin
        .from('part_prices')
        .insert({
          part_id: part.id,
          supplier_id: initial_price.supplier_id,
          unit_price: initial_price.unit_price,
          currency: initial_price.currency,
          document_id: document_id || null,
          valid_from: new Date().toISOString(),
        });

      if (priceError) {
        logger.error('Failed to create part price', { error: priceError.message, partId: part.id });
        // Warning: Part was created but price failed
      }
    }

    // 3. Update Document (if provided and we have supplier info)
    if (document_id && initial_price?.supplier_id) {
       const { error: docError } = await supabaseAdmin
        .from('documents')
        .update({ supplier_id: initial_price.supplier_id })
        .eq('id', document_id);
        
       if (docError) {
         logger.warn('Failed to update document supplier', { error: docError.message, documentId: document_id });
       }
    }

    logger.info('Part created', { partId: part.id, sku: part.sku });

    return NextResponse.json(part, { status: 201 });
  } catch (error) {
    logger.error('Parts POST API error', {
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
