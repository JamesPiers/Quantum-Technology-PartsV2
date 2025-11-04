#!/usr/bin/env node
/**
 * Test extraction on sample-quote.pdf to diagnose issues
 */

const fs = require('fs');
const path = require('path');

async function testExtraction() {
  const BASE_URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
  const samplePdfPath = path.join(__dirname, '..', 'sample-quote.pdf');

  console.log('🧪 Testing extraction with sample-quote.pdf\n');

  try {
    // Check if file exists
    if (!fs.existsSync(samplePdfPath)) {
      console.error('❌ sample-quote.pdf not found at:', samplePdfPath);
      process.exit(1);
    }

    const fileStats = fs.statSync(samplePdfPath);
    console.log(`📄 File found: ${(fileStats.size / 1024).toFixed(2)} KB\n`);

    // Step 1: Request upload URL
    console.log('📤 Step 1: Requesting upload URL...');
    const uploadResponse = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: 'sample-quote.pdf',
        fileType: 'application/pdf',
      }),
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json();
      console.error('❌ Upload URL request failed:', error);
      process.exit(1);
    }

    const { uploadUrl, documentId, filePath } = await uploadResponse.json();
    console.log(`✅ Upload URL obtained`);
    console.log(`   Document ID: ${documentId}`);
    console.log(`   File Path: ${filePath}\n`);

    // Step 2: Upload file
    console.log('📤 Step 2: Uploading PDF to storage...');
    const fileBuffer = fs.readFileSync(samplePdfPath);
    const uploadFileResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: fileBuffer,
      headers: {
        'Content-Type': 'application/pdf',
      },
    });

    if (!uploadFileResponse.ok) {
      console.error('❌ File upload failed:', uploadFileResponse.statusText);
      process.exit(1);
    }

    console.log('✅ File uploaded successfully\n');

    // Step 3: Test extraction with different providers
    const providers = ['mock', 'openai', 'docai', 'docai-invoice'];
    
    for (const provider of providers) {
      console.log(`\n🧠 Step 3: Testing extraction with provider: ${provider}`);
      console.log('─'.repeat(60));

      const extractResponse = await fetch(`${BASE_URL}/api/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          provider,
        }),
      });

      const extractData = await extractResponse.json();

      if (!extractResponse.ok) {
        console.error(`❌ Extraction failed (${extractResponse.status}):`);
        console.error(`   Error: ${extractData.error}`);
        if (extractData.details) {
          console.error(`   Details: ${extractData.details}`);
        }
        if (extractData.message) {
          console.error(`   Message: ${extractData.message}`);
        }
        continue;
      }

      console.log('✅ Extraction successful!');
      console.log(`   Extraction ID: ${extractData.extractionId}`);
      console.log(`   Status: ${extractData.status}`);
      
      if (extractData.data) {
        console.log('\n📊 Extracted Data:');
        console.log(`   Supplier: ${extractData.data.supplier_name}`);
        console.log(`   Quote #: ${extractData.data.quote_number || 'N/A'}`);
        console.log(`   Date: ${extractData.data.quote_date || 'N/A'}`);
        console.log(`   Currency: ${extractData.data.currency || 'N/A'}`);
        console.log(`   Valid Until: ${extractData.data.valid_until || 'N/A'}`);
        console.log(`   Line Items: ${extractData.data.line_items.length}`);
        
        if (extractData.data.line_items.length > 0) {
          console.log('\n   Sample Line Item:');
          const item = extractData.data.line_items[0];
          console.log(`   - Part #: ${item.supplier_part_number}`);
          console.log(`   - Description: ${item.description}`);
          console.log(`   - UOM: ${item.uom || 'N/A'}`);
          console.log(`   - Qty Breaks: ${item.qty_breaks.length}`);
          item.qty_breaks.forEach(qb => {
            console.log(`     • ${qb.min_qty}+ @ $${qb.unit_price}`);
          });
        }
      }
    }

    console.log('\n\n✅ All tests completed!');
  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    if (error.cause) {
      console.error('   Cause:', error.cause);
    }
    process.exit(1);
  }
}

// Run the test
testExtraction();

