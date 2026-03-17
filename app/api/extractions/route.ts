/**
 * GET /api/extractions - List extractions, optionally filtered by status
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('extractions')
      .select('*, documents(file_path, doc_type, status, created_at)')
      .order('created_at', { ascending: false });

    if (status) {
      // Support comma-separated statuses
      const statuses = status.split(',').map(s => s.trim());
      query = query.in('status', statuses);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to list extractions', { error: error.message });
      return NextResponse.json(
        { error: 'Failed to list extractions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    logger.error('List extractions error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
