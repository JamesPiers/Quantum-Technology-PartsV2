/**
 * GET /api/health
 * Health check endpoint to verify Supabase connection and storage access
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  const checks = {
    timestamp: new Date().toISOString(),
    environment: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'missing',
    },
    storage: {
      bucketsAccessible: false,
      supplierDocsBucketExists: false,
      canCreateSignedUrl: false,
      error: null as string | null,
    },
  };

  try {
    // Test 1: List buckets
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
    
    if (bucketsError) {
      checks.storage.error = bucketsError.message;
      return NextResponse.json(checks, { status: 500 });
    }

    checks.storage.bucketsAccessible = true;
    checks.storage.supplierDocsBucketExists = buckets.some(b => b.id === 'supplier-docs');

    // Test 2: Try creating a signed URL
    if (checks.storage.supplierDocsBucketExists) {
      const testPath = `health-check/${Date.now()}-test.pdf`;
      const { data, error } = await supabaseAdmin.storage
        .from('supplier-docs')
        .createSignedUploadUrl(testPath);

      if (error) {
        checks.storage.error = `Signed URL error: ${error.message}`;
      } else {
        checks.storage.canCreateSignedUrl = true;
      }
    }

    const allHealthy = 
      checks.environment.hasSupabaseUrl &&
      checks.environment.hasServiceRoleKey &&
      checks.storage.bucketsAccessible &&
      checks.storage.supplierDocsBucketExists &&
      checks.storage.canCreateSignedUrl;

    return NextResponse.json(checks, { 
      status: allHealthy ? 200 : 500 
    });

  } catch (error) {
    checks.storage.error = error instanceof Error ? error.message : String(error);
    return NextResponse.json(checks, { status: 500 });
  }
}

