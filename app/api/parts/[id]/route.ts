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
    const { data, error } = await supabaseAdmin
      .from('parts')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Part not found' }, { status: 404 });
    }

    return NextResponse.json(data);
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

