/**
 * POST /api/upload
 * Generate signed URL for PDF upload and create document record
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { uploadRequestSchema } from '@/lib/schemas/api.schema';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = uploadRequestSchema.parse(body);

    const { fileName, fileType, supplierId } = validated;

    // Generate unique file path (use 'pending' folder if no supplier ID yet)
    const timestamp = Date.now();
    const folder = supplierId || 'pending';
    const filePath = `${folder}/${timestamp}-${fileName}`;

    // Create signed upload URL
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('supplier-docs')
      .createSignedUploadUrl(filePath);

    if (uploadError) {
      logger.error('Failed to create signed upload URL', {
        error: uploadError.message,
        supplierId: supplierId || 'pending',
      });
      return NextResponse.json(
        { error: 'Failed to create upload URL' },
        { status: 500 }
      );
    }

    // Create document record (supplier_id will be set after extraction)
    const { data: document, error: docError } = await supabaseAdmin
      .from('documents')
      .insert({
        supplier_id: supplierId || null,
        file_path: filePath,
        doc_type: 'quote',
        status: 'uploaded',
      })
      .select()
      .single();

    if (docError) {
      logger.error('Failed to create document record', {
        error: docError.message,
        supplierId: supplierId || 'pending',
      });
      return NextResponse.json(
        { error: 'Failed to create document record' },
        { status: 500 }
      );
    }

    logger.info('Upload URL created', {
      documentId: document.id,
      supplierId: supplierId || 'pending',
      filePath,
    });

    return NextResponse.json({
      uploadUrl: uploadData.signedUrl,
      documentId: document.id,
      filePath,
    });
  } catch (error) {
    logger.error('Upload API error', {
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

