/**
 * GET /api/documents/:id/url
 * Get signed URL for document
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get document details
    const { data: document, error: docError } = await supabaseAdmin
      .from('documents')
      .select('file_path')
      .eq('id', params.id)
      .single();

    if (docError || !document) {
      logger.error('Document not found', {
        documentId: params.id,
        error: docError?.message,
      });
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Get signed URL
    const { data: urlData, error: urlError } = await supabaseAdmin.storage
      .from('supplier-docs')
      .createSignedUrl(document.file_path, 3600); // 1 hour expiry

    if (urlError || !urlData?.signedUrl) {
      logger.error('Failed to create signed URL', {
        documentId: params.id,
        error: urlError?.message,
      });
      return NextResponse.json(
        { error: 'Failed to get document URL' },
        { status: 500 }
      );
    }

    return NextResponse.json({ signedUrl: urlData.signedUrl });
  } catch (error) {
    logger.error('Document URL API error', {
      documentId: params.id,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

