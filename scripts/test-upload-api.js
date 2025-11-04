/**
 * Test the /api/upload endpoint directly
 */

async function testUploadAPI() {
  console.log('🧪 Testing /api/upload endpoint...\n');

  const testPayload = {
    fileName: 'test-quote.pdf',
    fileType: 'application/pdf',
    // supplierId is now optional
  };

  console.log('📤 Request payload:', JSON.stringify(testPayload, null, 2));

  try {
    const response = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    console.log(`\n📊 Response status: ${response.status} ${response.statusText}`);

    const data = await response.json();
    console.log('📦 Response body:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('\n❌ API returned error!');
      console.log('\n🔧 Check:');
      console.log('1. Is the dev server running? (npm run dev)');
      console.log('2. Check terminal logs for errors');
      console.log('3. Verify Supabase connection');
      process.exit(1);
    }

    console.log('\n✅ API endpoint working!');
    console.log(`   Document ID: ${data.documentId}`);
    console.log(`   File Path: ${data.filePath}`);
    console.log(`   Upload URL: ${data.uploadUrl.substring(0, 60)}...`);

  } catch (error) {
    console.error('\n❌ Error calling API:', error.message);
    console.log('\n🔧 Make sure dev server is running:');
    console.log('   npm run dev');
    process.exit(1);
  }
}

testUploadAPI();

