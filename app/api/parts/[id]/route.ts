/**
 * GET /api/parts/:id - Get part by ID
 * PATCH /api/parts/:id - Update part
 * DELETE /api/parts/:id - Delete part
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { updatePartSchema } from '@/lib/schemas/api.schema';
import { logger } from '@/lib/utils/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Fetch part details
    const { data: part, error: partError } = await supabaseAdmin
      .from('parts')
      .select('*')
      .eq('id', params.id)
      .single();

    if (partError || !part) {
      return NextResponse.json({ error: 'Part not found' }, { status: 404 });
    }

    // Fetch all prices with related data (supplier, document, extraction)
    const { data: prices, error: pricesError } = await supabaseAdmin
      .from('part_prices')
      .select(`
        *,
        supplier:suppliers(*),
        document:documents(*),
        extraction:extractions(*)
      `)
      .eq('part_id', params.id)
      .order('created_at', { ascending: false });

    if (pricesError) {
      logger.error('Failed to fetch part prices', {
        partId: params.id,
        error: pricesError.message,
      });
      // Continue without prices rather than failing
    }

    // Determine current (most recent valid) price
    const now = new Date().toISOString().split('T')[0];
    const currentPrice = prices?.find((price) => {
      const validFrom = price.valid_from;
      const validThrough = price.valid_through;
      return (
        validFrom <= now &&
        (validThrough === null || validThrough >= now)
      );
    }) || prices?.[0]; // Fall back to most recent if no valid price found

    const result = {
      ...part,
      prices: prices || [],
      current_price: currentPrice,
    };

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Part GET API error', {
      partId: params.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validated = updatePartSchema.parse(body);

    const { data, error } = await supabaseAdmin
      .from('parts')
      .update(validated)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update part', {
        partId: params.id,
        error: error.message,
      });
      return NextResponse.json(
        { error: 'Failed to update part' },
        { status: 500 }
      );
    }

    logger.info('Part updated', { partId: params.id });

    return NextResponse.json(data);
  } catch (error) {
    logger.error('Part PATCH API error', {
      partId: params.id,
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseAdmin
      .from('parts')
      .delete()
      .eq('id', params.id);

    if (error) {
      logger.error('Failed to delete part', {
        partId: params.id,
        error: error.message,
      });
      return NextResponse.json(
        { error: 'Failed to delete part' },
        { status: 500 }
      );
    }

    logger.info('Part deleted', { partId: params.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Part DELETE API error', {
      partId: params.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

