/**
 * GET /api/extractions/:id - Get extraction by ID
 * PATCH /api/extractions/:id - Save draft progress (update normalized_json, status, draft_name)
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { supplierInfo, lineItems, draftName } = body;

    // Build the updated normalized JSON preserving existing data
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('extractions')
      .select('normalized_json')
      .eq('id', params.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Extraction not found' },
        { status: 404 }
      );
    }

    const currentNormalized = existing.normalized_json as any;
    const updatedNormalized = {
      ...currentNormalized,
      ...(supplierInfo || {}),
      line_items: lineItems || currentNormalized.line_items,
    };

    const updateData: any = {
      normalized_json: updatedNormalized,
      status: 'draft',
    };

    if (draftName) {
      // Store draft_name in the accuracy JSONB field (reusing existing column)
      // since we can't add new columns without a migration
      updateData.accuracy = {
        ...(typeof existing.normalized_json === 'object' ? {} : {}),
        draft_name: draftName,
        saved_at: new Date().toISOString(),
      };
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('extractions')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      logger.error('Failed to save draft', {
        extractionId: params.id,
        error: updateError.message,
      });
      return NextResponse.json(
        { error: 'Failed to save draft' },
        { status: 500 }
      );
    }

    logger.info('Draft saved', { extractionId: params.id, draftName });

    return NextResponse.json({ success: true, extraction: updated });
  } catch (error) {
    logger.error('Save draft error', {
      extractionId: params.id,
      error: error instanceof Error ? error.message : String(error),
    });

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
      .from('extractions')
      .delete()
      .eq('id', params.id);

    if (error) {
      logger.error('Failed to delete extraction', {
        extractionId: params.id,
        error: error.message,
      });
      return NextResponse.json(
        { error: 'Failed to delete extraction' },
        { status: 500 }
      );
    }

    logger.info('Extraction deleted', { extractionId: params.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Delete extraction error', {
      extractionId: params.id,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

