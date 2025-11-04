/**
 * Batch comparison script for testing multiple PDFs against both providers
 * 
 * Usage:
 *   node scripts/batch-compare-providers.js path/to/pdfs/directory
 * 
 * This will:
 * 1. Find all PDF files in the directory
 * 2. Run extraction with both providers for each PDF
 * 3. Generate a comprehensive comparison report
 * 4. Export results to JSON for further analysis
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
 * Find all PDF files in directory
 */
function findPdfFiles(directory) {
  if (!fs.existsSync(directory)) {
    throw new Error(`Directory not found: ${directory}`);
  }

  const files = fs.readdirSync(directory);
  return files
    .filter(file => file.toLowerCase().endsWith('.pdf'))
    .map(file => path.join(directory, file));
}

/**
 * Upload a PDF file
 */
async function uploadPdf(pdfPath) {
  const fileName = path.basename(pdfPath);
  const fileBuffer = fs.readFileSync(pdfPath);
  
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

  const { uploadUrl, documentId } = await uploadResponse.json();

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

  return { documentId, fileName };
}

/**
 * Run extraction with specified provider
 */
async function runExtraction(documentId, provider) {
  const response = await fetch(`${API_BASE_URL}/api/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documentId, provider }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`${provider} extraction failed: ${error}`);
  }

  const { extractionId } = await response.json();

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
 * Test a single PDF with both providers
 */
async function testPdf(pdfPath, index, total) {
  const fileName = path.basename(pdfPath);
  console.log(`\n[${'='.repeat(50)}]`);
  console.log(`📄 Testing ${index + 1}/${total}: ${fileName}`);
  console.log(`[${'='.repeat(50)}]`);

  try {
    // Upload
    console.log('  📤 Uploading...');
    const { documentId } = await uploadPdf(pdfPath);

    // Run extractions
    console.log('  🤖 Running OpenAI extraction...');
    const openaiResult = await runExtraction(documentId, 'openai');
    
    console.log('  🤖 Running Document AI extraction...');
    const docaiResult = await runExtraction(documentId, 'docai');

    console.log('  ✅ Completed');

    return {
      fileName,
      documentId,
      success: true,
      openai: {
        id: openaiResult.id,
        metrics: openaiResult.accuracy,
        normalized: openaiResult.normalized_json,
      },
      docai: {
        id: docaiResult.id,
        metrics: docaiResult.accuracy,
        normalized: docaiResult.normalized_json,
      },
    };
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return {
      fileName,
      success: false,
      error: error.message,
    };
  }
}

/**
 * Calculate aggregate statistics
 */
function calculateStats(results) {
  const successfulTests = results.filter(r => r.success);
  
  if (successfulTests.length === 0) {
    return null;
  }

  const stats = {
    openai: {
      avgResponseTime: 0,
      avgCompletenessScore: 0,
      avgLineItems: 0,
      totalTokens: 0,
      successRate: 0,
    },
    docai: {
      avgResponseTime: 0,
      avgCompletenessScore: 0,
      avgLineItems: 0,
      successRate: 0,
    },
  };

  let openaiSuccesses = 0;
  let docaiSuccesses = 0;

  for (const result of successfulTests) {
    if (result.openai?.metrics) {
      const metrics = result.openai.metrics;
      stats.openai.avgResponseTime += metrics.response_time_ms || 0;
      stats.openai.avgCompletenessScore += metrics.completeness_score || 0;
      stats.openai.avgLineItems += metrics.line_items_count || 0;
      stats.openai.totalTokens += metrics.token_usage || 0;
      openaiSuccesses++;
    }

    if (result.docai?.metrics) {
      const metrics = result.docai.metrics;
      stats.docai.avgResponseTime += metrics.response_time_ms || 0;
      stats.docai.avgCompletenessScore += metrics.completeness_score || 0;
      stats.docai.avgLineItems += metrics.line_items_count || 0;
      docaiSuccesses++;
    }
  }

  if (openaiSuccesses > 0) {
    stats.openai.avgResponseTime = Math.round(stats.openai.avgResponseTime / openaiSuccesses);
    stats.openai.avgCompletenessScore = (stats.openai.avgCompletenessScore / openaiSuccesses).toFixed(3);
    stats.openai.avgLineItems = (stats.openai.avgLineItems / openaiSuccesses).toFixed(1);
    stats.openai.successRate = ((openaiSuccesses / successfulTests.length) * 100).toFixed(1);
  }

  if (docaiSuccesses > 0) {
    stats.docai.avgResponseTime = Math.round(stats.docai.avgResponseTime / docaiSuccesses);
    stats.docai.avgCompletenessScore = (stats.docai.avgCompletenessScore / docaiSuccesses).toFixed(3);
    stats.docai.avgLineItems = (stats.docai.avgLineItems / docaiSuccesses).toFixed(1);
    stats.docai.successRate = ((docaiSuccesses / successfulTests.length) * 100).toFixed(1);
  }

  return stats;
}

/**
 * Display summary report
 */
function displayReport(results, stats) {
  console.log('\n\n' + '='.repeat(100));
  console.log('📊 BATCH COMPARISON REPORT');
  console.log('='.repeat(100));

  // Overall Summary
  console.log('\n📈 OVERALL STATISTICS');
  console.log('─'.repeat(100));
  console.log(`Total PDFs Tested: ${results.length}`);
  console.log(`Successful Tests: ${results.filter(r => r.success).length}`);
  console.log(`Failed Tests: ${results.filter(r => !r.success).length}`);

  if (!stats) {
    console.log('\n❌ No successful tests to analyze');
    return;
  }

  // Performance Comparison
  console.log('\n⚡ PERFORMANCE COMPARISON');
  console.log('─'.repeat(100));
  console.log(
    `${'Metric'.padEnd(35)} | ${'OpenAI'.padEnd(25)} | ${'Document AI'.padEnd(25)} | ${'Winner'.padEnd(10)}`
  );
  console.log('─'.repeat(100));

  const avgResponseWinner = stats.openai.avgResponseTime <= stats.docai.avgResponseTime ? 'OpenAI' : 'Document AI';
  console.log(
    `${'Avg Response Time'.padEnd(35)} | ${`${stats.openai.avgResponseTime} ms`.padEnd(25)} | ${`${stats.docai.avgResponseTime} ms`.padEnd(25)} | ${avgResponseWinner.padEnd(10)}`
  );

  const completenessWinner = parseFloat(stats.openai.avgCompletenessScore) >= parseFloat(stats.docai.avgCompletenessScore) ? 'OpenAI' : 'Document AI';
  console.log(
    `${'Avg Completeness Score'.padEnd(35)} | ${`${(parseFloat(stats.openai.avgCompletenessScore) * 100).toFixed(1)}%`.padEnd(25)} | ${`${(parseFloat(stats.docai.avgCompletenessScore) * 100).toFixed(1)}%`.padEnd(25)} | ${completenessWinner.padEnd(10)}`
  );

  const lineItemsWinner = parseFloat(stats.openai.avgLineItems) >= parseFloat(stats.docai.avgLineItems) ? 'OpenAI' : 'Document AI';
  console.log(
    `${'Avg Line Items Extracted'.padEnd(35)} | ${stats.openai.avgLineItems.padEnd(25)} | ${stats.docai.avgLineItems.padEnd(25)} | ${lineItemsWinner.padEnd(10)}`
  );

  console.log(
    `${'Total Tokens Used (OpenAI)'.padEnd(35)} | ${`${stats.openai.totalTokens}`.padEnd(25)} | ${`N/A`.padEnd(25)} | ${'-'.padEnd(10)}`
  );

  // Individual Results
  console.log('\n📋 INDIVIDUAL RESULTS');
  console.log('─'.repeat(100));

  for (const result of results) {
    if (!result.success) {
      console.log(`❌ ${result.fileName}: FAILED - ${result.error}`);
      continue;
    }

    const openaiScore = (result.openai.metrics.completeness_score * 100).toFixed(1);
    const docaiScore = (result.docai.metrics.completeness_score * 100).toFixed(1);
    const openaiTime = result.openai.metrics.response_time_ms;
    const docaiTime = result.docai.metrics.response_time_ms;
    const openaiItems = result.openai.metrics.line_items_count;
    const docaiItems = result.docai.metrics.line_items_count;

    console.log(`\n✅ ${result.fileName}`);
    console.log(`   OpenAI:      ${openaiScore}% complete | ${openaiTime}ms | ${openaiItems} items`);
    console.log(`   Document AI: ${docaiScore}% complete | ${docaiTime}ms | ${docaiItems} items`);
  }

  // Recommendations
  console.log('\n💡 RECOMMENDATIONS');
  console.log('─'.repeat(100));

  const scores = {
    openai: 0,
    docai: 0,
  };

  if (stats.openai.avgResponseTime <= stats.docai.avgResponseTime) {
    scores.openai++;
    console.log('⚡ OpenAI is faster on average');
  } else {
    scores.docai++;
    console.log('⚡ Document AI is faster on average');
  }

  if (parseFloat(stats.openai.avgCompletenessScore) >= parseFloat(stats.docai.avgCompletenessScore)) {
    scores.openai++;
    console.log('📊 OpenAI has higher completeness scores');
  } else {
    scores.docai++;
    console.log('📊 Document AI has higher completeness scores');
  }

  if (parseFloat(stats.openai.avgLineItems) >= parseFloat(stats.docai.avgLineItems)) {
    scores.openai++;
    console.log('📦 OpenAI extracts more line items on average');
  } else {
    scores.docai++;
    console.log('📦 Document AI extracts more line items on average');
  }

  console.log('\n🏆 OVERALL WINNER:');
  if (scores.openai > scores.docai) {
    console.log('   OpenAI performs better overall for your use case');
  } else if (scores.docai > scores.openai) {
    console.log('   Document AI performs better overall for your use case');
  } else {
    console.log('   Both providers perform similarly - consider cost and other factors');
  }

  console.log('\n💰 COST CONSIDERATIONS:');
  console.log('   OpenAI:      ~$0.01 per 1K tokens (GPT-4 Turbo)');
  console.log(`                Total tokens used: ${stats.openai.totalTokens}`);
  console.log(`                Estimated cost: $${((stats.openai.totalTokens / 1000) * 0.01).toFixed(4)}`);
  console.log('   Document AI: ~$1.50 per 1K pages');
  console.log(`                Total pages: ~${results.filter(r => r.success).length}`);
  console.log(`                Estimated cost: $${(results.filter(r => r.success).length * 0.0015).toFixed(4)}`);

  console.log('\n' + '='.repeat(100));
}

/**
 * Save results to JSON file
 */
function saveResults(results, stats) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputFile = path.join(__dirname, `comparison-results-${timestamp}.json`);
  
  const report = {
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    successfulTests: results.filter(r => r.success).length,
    statistics: stats,
    results,
  };

  fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
  console.log(`\n💾 Results saved to: ${outputFile}`);
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Batch Provider Comparison Tool');
  console.log('='.repeat(100));

  const directory = process.argv[2];
  
  if (!directory) {
    console.error('\n❌ Error: Please provide a directory path');
    console.log('\nUsage:');
    console.log('  node scripts/batch-compare-providers.js path/to/pdfs/directory');
    process.exit(1);
  }

  try {
    // Find all PDFs
    const pdfFiles = findPdfFiles(directory);
    
    if (pdfFiles.length === 0) {
      console.error(`\n❌ No PDF files found in: ${directory}`);
      process.exit(1);
    }

    console.log(`\n📁 Found ${pdfFiles.length} PDF file(s) in ${directory}`);
    console.log(`\n⏳ Starting batch comparison (this may take a while)...`);

    // Test each PDF
    const results = [];
    for (let i = 0; i < pdfFiles.length; i++) {
      const result = await testPdf(pdfFiles[i], i, pdfFiles.length);
      results.push(result);
      
      // Add a small delay between tests to avoid rate limiting
      if (i < pdfFiles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Calculate statistics
    const stats = calculateStats(results);

    // Display report
    displayReport(results, stats);

    // Save results
    saveResults(results, stats);

    console.log('\n✅ Batch comparison complete!');

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

module.exports = { findPdfFiles, testPdf, calculateStats };

