/**
 * PATCH /api/order-items/:id - Update order item
 * DELETE /api/order-items/:id - Delete order item
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { updateOrderItemSchema } from '@/lib/schemas/api.schema';
import { logger } from '@/lib/utils/logger';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validated = updateOrderItemSchema.parse(body);

    const { data, error } = await supabaseAdmin
      .from('order_items')
      .update(validated)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update order item', {
        orderItemId: params.id,
        error: error.message,
      });
      return NextResponse.json(
        { error: 'Failed to update order item' },
        { status: 500 }
      );
    }

    logger.info('Order item updated', { orderItemId: params.id });

    return NextResponse.json(data);
  } catch (error) {
    logger.error('Order item PATCH API error', {
      orderItemId: params.id,
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
      .from('order_items')
      .delete()
      .eq('id', params.id);

    if (error) {
      logger.error('Failed to delete order item', {
        orderItemId: params.id,
        error: error.message,
      });
      return NextResponse.json(
        { error: 'Failed to delete order item' },
        { status: 500 }
      );
    }

    logger.info('Order item deleted', { orderItemId: params.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Order item DELETE API error', {
      orderItemId: params.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

