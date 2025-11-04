/**
 * GET /api/extractions/:id
 * Get extraction by ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: extraction, error } = await supabaseAdmin
      .from('extractions')
      .select('*, documents(*)')
      .eq('id', params.id)
      .single();

    if (error) {
      logger.error('Failed to fetch extraction', {
        extractionId: params.id,
        error: error.message,
      });
      return NextResponse.json(
        { error: 'Extraction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(extraction);
  } catch (error) {
    logger.error('Extractions API error', {
      extractionId: params.id,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

