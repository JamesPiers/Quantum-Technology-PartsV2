/**
 * Script to compare OpenAI and Document AI extraction providers
 * 
 * Usage:
 *   node scripts/compare-extraction-providers.js path/to/sample.pdf
 * 
 * This script will:
 * 1. Upload the PDF document
 * 2. Run extraction with OpenAI provider
 * 3. Run extraction with Document AI provider
 * 4. Display side-by-side comparison of results
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Upload a PDF file and get document ID
 */
async function uploadPdf(pdfPath) {
  console.log('\n📤 Uploading PDF...');
  
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`File not found: ${pdfPath}`);
  }

  const fileName = path.basename(pdfPath);
  const fileBuffer = fs.readFileSync(pdfPath);
  
  // Step 1: Get upload URL from API
  const uploadResponse = await fetch(`${API_BASE_URL}/api/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName,
      fileType: 'application/pdf',
    }),
  });

  if (!uploadResponse.ok) {
    throw new Error(`Upload API failed: ${uploadResponse.statusText}`);
  }

  const { uploadUrl, documentId, filePath } = await uploadResponse.json();
  console.log(`✅ Got upload URL for document: ${documentId}`);

  // Step 2: Upload file to Supabase Storage
  const uploadToStorageResponse = await fetch(uploadUrl, {
    method: 'PUT',
    body: fileBuffer,
    headers: {
      'Content-Type': 'application/pdf',
      'x-upsert': 'true',
    },
  });

  if (!uploadToStorageResponse.ok) {
    throw new Error(`Storage upload failed: ${uploadToStorageResponse.statusText}`);
  }

  console.log(`✅ PDF uploaded successfully`);
  return { documentId, filePath, fileName };
}

/**
 * Run extraction with specified provider
 */
async function runExtraction(documentId, provider) {
  console.log(`\n🤖 Running ${provider.toUpperCase()} extraction...`);
  const startTime = Date.now();

  const response = await fetch(`${API_BASE_URL}/api/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documentId, provider }),
  });

  const elapsedTime = Date.now() - startTime;

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Extraction failed: ${response.statusText} - ${error}`);
  }

  const { extractionId } = await response.json();
  console.log(`✅ Extraction completed in ${elapsedTime}ms`);

  // Fetch extraction results
  const { data: extraction, error } = await supabase
    .from('extractions')
    .select('*')
    .eq('id', extractionId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch extraction: ${error.message}`);
  }

  return extraction;
}

/**
 * Display comparison table
 */
function displayComparison(openaiResult, docaiResult) {
  console.log('\n' + '='.repeat(120));
  console.log('📊 EXTRACTION COMPARISON RESULTS');
  console.log('='.repeat(120));

  // Performance Metrics
  console.log('\n📈 PERFORMANCE METRICS');
  console.log('─'.repeat(120));
  console.log(
    `${'Metric'.padEnd(30)} | ${'OpenAI'.padEnd(40)} | ${'Document AI'.padEnd(40)}`
  );
  console.log('─'.repeat(120));

  const openaiMetrics = openaiResult.accuracy || {};
  const docaiMetrics = docaiResult.accuracy || {};

  console.log(
    `${'Response Time'.padEnd(30)} | ${`${openaiMetrics.response_time_ms || 'N/A'} ms`.padEnd(40)} | ${`${docaiMetrics.response_time_ms || 'N/A'} ms`.padEnd(40)}`
  );
  console.log(
    `${'Token Usage'.padEnd(30)} | ${`${openaiMetrics.token_usage || 'N/A'}`.padEnd(40)} | ${`N/A (billed by page)`.padEnd(40)}`
  );
  console.log(
    `${'Completeness Score'.padEnd(30)} | ${`${((openaiMetrics.completeness_score || 0) * 100).toFixed(1)}%`.padEnd(40)} | ${`${((docaiMetrics.completeness_score || 0) * 100).toFixed(1)}%`.padEnd(40)}`
  );
  console.log(
    `${'Fields Present'.padEnd(30)} | ${`${openaiMetrics.fields_present || 0}/${openaiMetrics.total_fields || 0}`.padEnd(40)} | ${`${docaiMetrics.fields_present || 0}/${docaiMetrics.total_fields || 0}`.padEnd(40)}`
  );
  console.log(
    `${'Line Items Count'.padEnd(30)} | ${`${openaiMetrics.line_items_count || 0}`.padEnd(40)} | ${`${docaiMetrics.line_items_count || 0}`.padEnd(40)}`
  );

  // Extracted Data Comparison
  console.log('\n📄 EXTRACTED DATA');
  console.log('─'.repeat(120));

  const openaiData = openaiResult.normalized_json || {};
  const docaiData = docaiResult.normalized_json || {};

  const fields = [
    'supplier_name',
    'quote_number',
    'quote_date',
    'currency',
    'valid_until',
    'notes',
  ];

  console.log(
    `${'Field'.padEnd(30)} | ${'OpenAI'.padEnd(40)} | ${'Document AI'.padEnd(40)}`
  );
  console.log('─'.repeat(120));

  for (const field of fields) {
    const openaiValue = openaiData[field] || '-';
    const docaiValue = docaiData[field] || '-';
    const match = openaiValue === docaiValue ? '✅' : '⚠️';
    
    console.log(
      `${field.padEnd(30)} | ${truncate(String(openaiValue), 40).padEnd(40)} | ${truncate(String(docaiValue), 40).padEnd(40)} ${match}`
    );
  }

  // Line Items Comparison
  console.log('\n📦 LINE ITEMS COMPARISON');
  console.log('─'.repeat(120));

  const openaiItems = openaiData.line_items || [];
  const docaiItems = docaiData.line_items || [];
  const maxItems = Math.max(openaiItems.length, docaiItems.length);

  console.log(`OpenAI: ${openaiItems.length} items | Document AI: ${docaiItems.length} items`);
  console.log('─'.repeat(120));

  for (let i = 0; i < Math.min(maxItems, 5); i++) {
    const openaiItem = openaiItems[i];
    const docaiItem = docaiItems[i];

    console.log(`\nItem #${i + 1}:`);
    
    if (openaiItem) {
      console.log(`  OpenAI:`);
      console.log(`    Part #: ${openaiItem.supplier_part_number || 'N/A'}`);
      console.log(`    Description: ${truncate(openaiItem.description || 'N/A', 60)}`);
      console.log(`    UOM: ${openaiItem.uom || 'N/A'}`);
      console.log(`    Lead Time: ${openaiItem.lead_time_days || 'N/A'} days`);
      console.log(`    MOQ: ${openaiItem.moq || 'N/A'}`);
      console.log(`    Qty Breaks: ${openaiItem.qty_breaks?.length || 0}`);
      if (openaiItem.qty_breaks && openaiItem.qty_breaks.length > 0) {
        openaiItem.qty_breaks.forEach(qb => {
          console.log(`      - ${qb.min_qty}+ units @ $${qb.unit_price}`);
        });
      }
    }

    if (docaiItem) {
      console.log(`  Document AI:`);
      console.log(`    Part #: ${docaiItem.supplier_part_number || 'N/A'}`);
      console.log(`    Description: ${truncate(docaiItem.description || 'N/A', 60)}`);
      console.log(`    UOM: ${docaiItem.uom || 'N/A'}`);
      console.log(`    Lead Time: ${docaiItem.lead_time_days || 'N/A'} days`);
      console.log(`    MOQ: ${docaiItem.moq || 'N/A'}`);
      console.log(`    Qty Breaks: ${docaiItem.qty_breaks?.length || 0}`);
      if (docaiItem.qty_breaks && docaiItem.qty_breaks.length > 0) {
        docaiItem.qty_breaks.forEach(qb => {
          console.log(`      - ${qb.min_qty}+ units @ $${qb.unit_price}`);
        });
      }
    }
  }

  if (maxItems > 5) {
    console.log(`\n... and ${maxItems - 5} more items`);
  }

  // Summary
  console.log('\n' + '='.repeat(120));
  console.log('📝 SUMMARY');
  console.log('─'.repeat(120));

  const openaiScore = (openaiMetrics.completeness_score || 0) * 100;
  const docaiScore = (docaiMetrics.completeness_score || 0) * 100;
  const openaiTime = openaiMetrics.response_time_ms || 0;
  const docaiTime = docaiMetrics.response_time_ms || 0;

  console.log('\nCompleteness:');
  console.log(`  OpenAI:      ${openaiScore.toFixed(1)}% ${openaiScore >= docaiScore ? '🏆' : ''}`);
  console.log(`  Document AI: ${docaiScore.toFixed(1)}% ${docaiScore > openaiScore ? '🏆' : ''}`);

  console.log('\nSpeed:');
  console.log(`  OpenAI:      ${openaiTime}ms ${openaiTime <= docaiTime ? '⚡' : ''}`);
  console.log(`  Document AI: ${docaiTime}ms ${docaiTime < openaiTime ? '⚡' : ''}`);

  console.log('\nLine Items Extracted:');
  console.log(`  OpenAI:      ${openaiItems.length} ${openaiItems.length >= docaiItems.length ? '📦' : ''}`);
  console.log(`  Document AI: ${docaiItems.length} ${docaiItems.length > openaiItems.length ? '📦' : ''}`);

  console.log('\n' + '='.repeat(120));
}

/**
 * Truncate string to max length
 */
function truncate(str, maxLength) {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 OpenAI vs Document AI Extraction Comparison Tool');
  console.log('='.repeat(120));

  const pdfPath = process.argv[2];
  
  if (!pdfPath) {
    console.error('\n❌ Error: Please provide a PDF file path');
    console.log('\nUsage:');
    console.log('  node scripts/compare-extraction-providers.js path/to/sample.pdf');
    process.exit(1);
  }

  try {
    // Upload PDF
    const { documentId, fileName } = await uploadPdf(pdfPath);
    console.log(`\n📄 Testing with: ${fileName}`);

    // Run both extractions in parallel
    console.log('\n⏳ Running extractions with both providers...');
    const [openaiResult, docaiResult] = await Promise.all([
      runExtraction(documentId, 'openai'),
      runExtraction(documentId, 'docai'),
    ]);

    // Display comparison
    displayComparison(openaiResult, docaiResult);

    console.log('\n✅ Comparison complete!');
    console.log(`\nYou can review the extractions at:`);
    console.log(`  OpenAI:      ${API_BASE_URL}/review/${openaiResult.id}`);
    console.log(`  Document AI: ${API_BASE_URL}/review/${docaiResult.id}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { uploadPdf, runExtraction, displayComparison };

