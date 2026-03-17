/**
 * POST /api/parts/:id/prices
 * Manually add a new price record to a part
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

const addPriceSchema = z.object({
  supplier_id: z.string().uuid(),
  unit_price: z.number().nonnegative(),
  currency: z.string().min(1).default('USD'),
  moq: z.number().nonnegative().nullable().optional(),
  lead_time_days: z.number().nonnegative().nullable().optional(),
  valid_from: z.string().optional(),
  valid_through: z.string().nullable().optional(),
  document_id: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const partId = params.id;

    // Verify part exists
    const { data: part, error: partError } = await supabaseAdmin
      .from('parts')
      .select('id, sku')
      .eq('id', partId)
      .single();

    if (partError || !part) {
      return NextResponse.json(
        { error: 'Part not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validated = addPriceSchema.parse(body);

    const { data: price, error: priceError } = await supabaseAdmin
      .from('part_prices')
      .insert({
        part_id: partId,
        supplier_id: validated.supplier_id,
        unit_price: validated.unit_price,
        currency: validated.currency,
        moq: validated.moq || null,
        lead_time_days: validated.lead_time_days || null,
        valid_from: validated.valid_from || new Date().toISOString().split('T')[0],
        valid_through: validated.valid_through || null,
        document_id: validated.document_id || null,
      })
      .select('*, suppliers(*)')
      .single();

    if (priceError) {
      logger.error('Failed to create price', {
        partId,
        error: priceError.message,
      });
      return NextResponse.json(
        { error: 'Failed to create price record' },
        { status: 500 }
      );
    }

    logger.info('Manual price added', {
      partId,
      priceId: price.id,
      supplierId: validated.supplier_id,
    });

    return NextResponse.json(price, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Add price API error', {
      partId: params.id,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
