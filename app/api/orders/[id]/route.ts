/**
 * GET /api/orders/:id - Get order with items
 * PATCH /api/orders/:id - Update order
 * DELETE /api/orders/:id - Delete order
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { updateOrderSchema } from '@/lib/schemas/api.schema';
import { logger } from '@/lib/utils/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get order with items
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(
        `
        *,
        order_items (
          *,
          parts (*),
          suppliers:supplier_id (*)
        )
      `
      )
      .eq('id', params.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    logger.error('Order GET API error', {
      orderId: params.id,
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
    const validated = updateOrderSchema.parse(body);

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(validated)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update order', {
        orderId: params.id,
        error: error.message,
      });
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      );
    }

    logger.info('Order updated', { orderId: params.id });

    return NextResponse.json(data);
  } catch (error) {
    logger.error('Order PATCH API error', {
      orderId: params.id,
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
      .from('orders')
      .delete()
      .eq('id', params.id);

    if (error) {
      logger.error('Failed to delete order', {
        orderId: params.id,
        error: error.message,
      });
      return NextResponse.json(
        { error: 'Failed to delete order' },
        { status: 500 }
      );
    }

    logger.info('Order deleted', { orderId: params.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Order DELETE API error', {
      orderId: params.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

