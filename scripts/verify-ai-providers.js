/**
 * Quick verification script to test AI provider configurations
 * 
 * This script tests:
 * - OpenAI API connection and credentials
 * - Google Document AI connection and credentials
 * - Basic extraction capabilities
 * 
 * Usage:
 *   node scripts/verify-ai-providers.js
 */

const OpenAI = require('openai');
const { DocumentProcessorServiceClient } = require('@google-cloud/documentai');

console.log('🔍 AI Provider Configuration Verification');
console.log('='.repeat(80));

/**
 * Verify OpenAI setup
 */
async function verifyOpenAI() {
  console.log('\n🧠 Testing OpenAI Configuration...');
  console.log('─'.repeat(80));

  try {
    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
      console.log('❌ OPENAI_API_KEY not found in environment variables');
      return false;
    }
    console.log('✅ OPENAI_API_KEY is set');

    // Initialize client
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('✅ OpenAI client initialized');

    // Test API connection with a simple request
    console.log('⏳ Testing API connection...');
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant.',
        },
        {
          role: 'user',
          content: 'Say "OK" if you can read this.',
        },
      ],
      max_tokens: 10,
      temperature: 0,
    });

    const response = completion.choices[0].message.content;
    console.log('✅ API connection successful');
    console.log(`📝 Test response: "${response}"`);
    console.log(`💰 Tokens used: ${completion.usage?.total_tokens || 'N/A'}`);

    // Test structured output capability
    console.log('⏳ Testing structured output support...');
    const structuredTest = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: 'Extract: Supplier: Acme Corp, Part: WIDGET-001, Price: $10.50',
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'test_extraction',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              supplier: { type: 'string' },
              part: { type: 'string' },
              price: { type: 'number' },
            },
            required: ['supplier', 'part', 'price'],
            additionalProperties: false,
          },
        },
      },
      temperature: 0,
    });

    const structuredResponse = JSON.parse(structuredTest.choices[0].message.content || '{}');
    console.log('✅ Structured output working');
    console.log(`📋 Extracted: ${JSON.stringify(structuredResponse)}`);

    console.log('\n✅ OpenAI is fully configured and working!');
    return true;
  } catch (error) {
    console.log('\n❌ OpenAI verification failed');
    console.log(`Error: ${error.message}`);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Details: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

/**
 * Verify Document AI setup
 */
async function verifyDocumentAI() {
  console.log('\n☁️  Testing Google Document AI Configuration...');
  console.log('─'.repeat(80));

  try {
    // Check for required environment variables
    const requiredVars = [
      'GOOGLE_PROJECT_ID',
      'GOOGLE_LOCATION',
      'GOOGLE_PROCESSOR_ID',
      'GOOGLE_APPLICATION_CREDENTIALS',
    ];

    let allPresent = true;
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        console.log(`❌ ${varName} not found in environment variables`);
        allPresent = false;
      } else {
        console.log(`✅ ${varName} is set`);
      }
    }

    if (!allPresent) {
      console.log('\n❌ Missing required environment variables');
      return false;
    }

    // Check if credentials file exists
    const fs = require('fs');
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!fs.existsSync(credPath)) {
      console.log(`❌ Credentials file not found: ${credPath}`);
      return false;
    }
    console.log(`✅ Credentials file exists: ${credPath}`);

    // Initialize client
    const client = new DocumentProcessorServiceClient({
      keyFilename: credPath,
    });
    console.log('✅ Document AI client initialized');

    // Test processor exists
    console.log('⏳ Testing processor access...');
    const processorName = `projects/${process.env.GOOGLE_PROJECT_ID}/locations/${process.env.GOOGLE_LOCATION}/processors/${process.env.GOOGLE_PROCESSOR_ID}`;
    
    try {
      // Note: We can't easily test without a real document, but we can verify the client is properly configured
      console.log(`✅ Processor path: ${processorName}`);
      console.log('⚠️  Note: Full processor verification requires a test document');
      console.log('   Use the comparison scripts with a real PDF to fully test extraction');
    } catch (error) {
      console.log(`❌ Processor verification failed: ${error.message}`);
      return false;
    }

    console.log('\n✅ Document AI appears to be configured correctly!');
    console.log('   Run a test extraction with a real PDF to fully verify');
    return true;
  } catch (error) {
    console.log('\n❌ Document AI verification failed');
    console.log(`Error: ${error.message}`);
    return false;
  }
}

/**
 * Display summary
 */
function displaySummary(openaiOk, docaiOk) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(80));

  console.log('\nProvider Status:');
  console.log(`  OpenAI:      ${openaiOk ? '✅ Ready' : '❌ Not configured'}`);
  console.log(`  Document AI: ${docaiOk ? '✅ Ready' : '❌ Not configured'}`);

  if (openaiOk && docaiOk) {
    console.log('\n🎉 Both providers are ready!');
    console.log('\nNext steps:');
    console.log('  1. Test with a single PDF:');
    console.log('     npm run compare:single -- path/to/sample.pdf');
    console.log('  2. Run batch comparison:');
    console.log('     npm run compare:batch -- path/to/pdfs/directory');
    console.log('  3. Or use the web UI:');
    console.log('     npm run dev');
    console.log('     Open http://localhost:3000/upload');
  } else {
    console.log('\n⚠️  Some providers need configuration');
    console.log('\nConfiguration needed:');
    
    if (!openaiOk) {
      console.log('\n  OpenAI:');
      console.log('    1. Get API key from https://platform.openai.com/api-keys');
      console.log('    2. Add to .env.local: OPENAI_API_KEY=your_key_here');
    }
    
    if (!docaiOk) {
      console.log('\n  Document AI:');
      console.log('    1. Create a processor at https://console.cloud.google.com/ai/document-ai');
      console.log('    2. Download service account key JSON');
      console.log('    3. Add to .env.local:');
      console.log('       GOOGLE_PROJECT_ID=your_project_id');
      console.log('       GOOGLE_LOCATION=us');
      console.log('       GOOGLE_PROCESSOR_ID=your_processor_id');
      console.log('       GOOGLE_APPLICATION_CREDENTIALS=path/to/key.json');
    }
  }

  console.log('\n' + '='.repeat(80));
}

/**
 * Main execution
 */
async function main() {
  // Load environment variables
  require('dotenv').config({ path: '.env.local' });

  const openaiOk = await verifyOpenAI();
  const docaiOk = await verifyDocumentAI();

  displaySummary(openaiOk, docaiOk);

  process.exit(openaiOk && docaiOk ? 0 : 1);
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });
}

