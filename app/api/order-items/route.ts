/**
 * POST /api/order-items - Add item to order
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { createOrderItemSchema } from '@/lib/schemas/api.schema';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createOrderItemSchema.parse(body);

    // If unit_price not provided, try to get latest price from part_prices
    let unitPrice = validated.unit_price;
    
    if (!unitPrice) {
      const { data: prices } = await supabaseAdmin
        .from('part_prices')
        .select('unit_price')
        .eq('part_id', validated.part_id)
        .eq('supplier_id', validated.supplier_id)
        .lte('valid_from', new Date().toISOString())
        .or(`valid_through.is.null,valid_through.gte.${new Date().toISOString()}`)
        .order('valid_from', { ascending: false })
        .limit(1);

      if (prices && prices.length > 0) {
        unitPrice = prices[0].unit_price;
      } else {
        return NextResponse.json(
          { error: 'No valid price found for this part' },
          { status: 400 }
        );
      }
    }

    const { data, error } = await supabaseAdmin
      .from('order_items')
      .insert({
        ...validated,
        unit_price: unitPrice,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create order item', { error: error.message });
      return NextResponse.json(
        { error: 'Failed to create order item' },
        { status: 500 }
      );
    }

    logger.info('Order item created', { orderItemId: data.id });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    logger.error('Order items POST API error', {
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

