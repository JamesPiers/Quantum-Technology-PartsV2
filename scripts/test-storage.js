/**
 * Test Supabase Storage bucket access
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testStorage() {
  console.log('🧪 Testing Supabase Storage...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log('✅ Connected to Supabase');
  console.log(`📍 URL: ${supabaseUrl}\n`);

  // Test 1: List buckets
  console.log('📦 Test 1: Listing storage buckets...');
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  
  if (bucketsError) {
    console.error('❌ Error listing buckets:', bucketsError.message);
    console.error('Details:', bucketsError);
    return;
  }

  console.log(`✅ Found ${buckets.length} bucket(s):`);
  buckets.forEach(bucket => {
    console.log(`   - ${bucket.id} (${bucket.public ? 'public' : 'private'})`);
  });

  // Check if supplier-docs bucket exists
  const supplierDocsBucket = buckets.find(b => b.id === 'supplier-docs');
  if (!supplierDocsBucket) {
    console.error('\n❌ PROBLEM FOUND: "supplier-docs" bucket does not exist!');
    console.log('\n🔧 FIX: Run this SQL in Supabase SQL Editor:');
    console.log('────────────────────────────────────────────────────');
    console.log(`INSERT INTO storage.buckets (id, name, public)
VALUES ('supplier-docs', 'supplier-docs', false)
ON CONFLICT (id) DO NOTHING;`);
    console.log('────────────────────────────────────────────────────\n');
    return;
  }

  console.log('\n✅ "supplier-docs" bucket exists!');

  // Test 2: Try to create a signed upload URL
  console.log('\n📝 Test 2: Creating signed upload URL...');
  const testPath = `test/${Date.now()}-test.pdf`;
  
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('supplier-docs')
    .createSignedUploadUrl(testPath);

  if (uploadError) {
    console.error('❌ Error creating signed URL:', uploadError.message);
    console.error('Details:', uploadError);
    console.log('\n🔧 Possible issues:');
    console.log('1. Storage bucket policies might be too restrictive');
    console.log('2. Service role key might not have storage permissions');
    console.log('3. Check Supabase dashboard: Storage → Policies');
    return;
  }

  console.log('✅ Successfully created signed upload URL!');
  console.log(`   Path: ${testPath}`);
  console.log(`   URL: ${uploadData.signedUrl.substring(0, 60)}...`);

  // Test 3: List files in bucket
  console.log('\n📂 Test 3: Listing files in bucket...');
  const { data: files, error: listError } = await supabase.storage
    .from('supplier-docs')
    .list('', { limit: 5 });

  if (listError) {
    console.error('❌ Error listing files:', listError.message);
  } else {
    console.log(`✅ Can list files (${files.length} found in root)`);
  }

  console.log('\n✅ ALL TESTS PASSED!');
  console.log('🎉 Storage is configured correctly.\n');
}

testStorage().catch(error => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});

