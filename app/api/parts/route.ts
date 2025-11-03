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
      .select('*', { count: 'exact' })
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

    return NextResponse.json({
      data,
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

    const { data, error } = await supabaseAdmin
      .from('parts')
      .insert(validated)
      .select()
      .single();

    if (error) {
      logger.error('Failed to create part', { error: error.message });
      return NextResponse.json(
        { error: 'Failed to create part' },
        { status: 500 }
      );
    }

    logger.info('Part created', { partId: data.id, sku: data.sku });

    return NextResponse.json(data, { status: 201 });
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

