/**
 * POST /api/extractions/:id/reject
 * Reject an extraction
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseAdmin
      .from('extractions')
      .update({ status: 'rejected' })
      .eq('id', params.id);

    if (error) {
      logger.error('Failed to reject extraction', {
        extractionId: params.id,
        error: error.message,
      });
      return NextResponse.json(
        { error: 'Failed to reject extraction' },
        { status: 500 }
      );
    }

    logger.info('Extraction rejected', {
      extractionId: params.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Reject API error', {
      extractionId: params.id,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

