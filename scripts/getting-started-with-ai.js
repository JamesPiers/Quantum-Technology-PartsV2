/**
 * Interactive guide to help you get started with AI provider testing
 * 
 * Usage:
 *   node scripts/getting-started-with-ai.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n' + '='.repeat(80));
console.log('🚀 Getting Started with AI Provider Testing');
console.log('='.repeat(80));

console.log('\n👋 Welcome! This guide will help you test OpenAI and Google Document AI');
console.log('   with your supplier quote PDFs.\n');

/**
 * Check if environment variables are set
 */
function checkEnvVars() {
  const requiredForOpenAI = ['OPENAI_API_KEY'];
  const requiredForDocAI = [
    'GOOGLE_PROJECT_ID',
    'GOOGLE_LOCATION', 
    'GOOGLE_PROCESSOR_ID',
    'GOOGLE_APPLICATION_CREDENTIALS'
  ];

  const openAIConfigured = requiredForOpenAI.every(key => process.env[key]);
  const docAIConfigured = requiredForDocAI.every(key => process.env[key]);

  return { openAIConfigured, docAIConfigured };
}

/**
 * Display current configuration status
 */
function displayStatus() {
  console.log('📋 Current Configuration Status');
  console.log('─'.repeat(80));
  
  const { openAIConfigured, docAIConfigured } = checkEnvVars();
  
  console.log(`\n  OpenAI (GPT-4 Turbo):     ${openAIConfigured ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`  Google Document AI:       ${docAIConfigured ? '✅ Configured' : '❌ Not configured'}`);
  
  return { openAIConfigured, docAIConfigured };
}

/**
 * Show configuration instructions
 */
function showConfigInstructions(openAIConfigured, docAIConfigured) {
  if (!openAIConfigured && !docAIConfigured) {
    console.log('\n⚠️  Neither provider is configured yet.');
    console.log('\n📝 You need to set up at least one provider to test with real PDFs.\n');
  } else if (!openAIConfigured || !docAIConfigured) {
    console.log('\n⚠️  One provider is configured. Configure both to run comparisons.\n');
  } else {
    console.log('\n✅ Both providers are configured and ready to test!\n');
    return true;
  }

  if (!openAIConfigured) {
    console.log('🧠 To configure OpenAI:');
    console.log('   1. Get API key from https://platform.openai.com/api-keys');
    console.log('   2. Add to .env.local:');
    console.log('      OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx');
    console.log('');
  }

  if (!docAIConfigured) {
    console.log('☁️  To configure Google Document AI:');
    console.log('   1. Create processor at https://console.cloud.google.com/ai/document-ai');
    console.log('   2. Download service account key JSON');
    console.log('   3. Add to .env.local:');
    console.log('      GOOGLE_PROJECT_ID=your-project-id');
    console.log('      GOOGLE_LOCATION=us');
    console.log('      GOOGLE_PROCESSOR_ID=your-processor-id');
    console.log('      GOOGLE_APPLICATION_CREDENTIALS=./path-to-key.json');
    console.log('');
  }

  return false;
}

/**
 * Display next steps
 */
function displayNextSteps(bothConfigured) {
  console.log('─'.repeat(80));
  console.log('🎯 Next Steps');
  console.log('─'.repeat(80));

  if (!bothConfigured) {
    console.log('\n1️⃣  Configure your AI provider credentials (see above)');
    console.log('');
    console.log('2️⃣  Verify your setup:');
    console.log('    npm run verify:ai');
    console.log('');
    console.log('3️⃣  Come back and run this script again:');
    console.log('    node scripts/getting-started-with-ai.js');
  } else {
    console.log('\n1️⃣  Verify both providers are working:');
    console.log('    npm run verify:ai');
    console.log('');
    console.log('2️⃣  Test with a single PDF:');
    console.log('    npm run compare:single -- path/to/your-quote.pdf');
    console.log('');
    console.log('    This will:');
    console.log('    • Upload your PDF');
    console.log('    • Extract with both OpenAI and Document AI');
    console.log('    • Show detailed side-by-side comparison');
    console.log('    • Recommend which provider works better');
    console.log('');
    console.log('3️⃣  (Optional) Test with multiple PDFs:');
    console.log('    npm run compare:batch -- path/to/pdfs/directory');
    console.log('');
    console.log('    This will:');
    console.log('    • Test all PDFs in the directory');
    console.log('    • Calculate aggregate statistics');
    console.log('    • Provide cost estimates');
    console.log('    • Save results to JSON for analysis');
    console.log('');
    console.log('4️⃣  Test via Web UI:');
    console.log('    npm run dev');
    console.log('    Open http://localhost:3000/upload');
    console.log('');
    console.log('    • Select your preferred provider');
    console.log('    • Upload and test PDFs interactively');
    console.log('    • Review extraction results');
    console.log('');
    console.log('5️⃣  Set your default provider:');
    console.log('    After testing, update .env.local:');
    console.log('    USE_PROVIDER=openai    (or "docai")');
  }
}

/**
 * Display helpful resources
 */
function displayResources() {
  console.log('\n─'.repeat(80));
  console.log('📚 Documentation & Resources');
  console.log('─'.repeat(80));
  console.log('');
  console.log('  📘 AI_PROVIDERS_QUICKSTART.md');
  console.log('     Quick start guide - get testing in 5 minutes');
  console.log('');
  console.log('  📗 PROVIDER_COMPARISON_GUIDE.md');
  console.log('     Comprehensive guide - detailed methodology and tips');
  console.log('');
  console.log('  📕 WHATS_NEW.md');
  console.log('     Feature overview and migration guide');
  console.log('');
  console.log('  📙 README.md');
  console.log('     General project documentation');
  console.log('');
}

/**
 * Display tips
 */
function displayTips() {
  console.log('─'.repeat(80));
  console.log('💡 Tips for Best Results');
  console.log('─'.repeat(80));
  console.log('');
  console.log('  ✅ Start with 3-5 representative PDF documents');
  console.log('  ✅ Use actual supplier quotes (not generic samples)');
  console.log('  ✅ Manually verify extraction accuracy');
  console.log('  ✅ Test both providers with the same documents');
  console.log('  ✅ Consider your priorities: accuracy vs speed vs cost');
  console.log('  ✅ Monitor API usage and costs');
  console.log('');
}

/**
 * Main execution
 */
function main() {
  // Load environment variables
  require('dotenv').config({ path: '.env.local' });

  // Check status
  const { openAIConfigured, docAIConfigured } = displayStatus();
  const bothConfigured = openAIConfigured && docAIConfigured;

  console.log('');
  
  // Show configuration instructions
  const readyToTest = showConfigInstructions(openAIConfigured, docAIConfigured);

  // Display next steps
  displayNextSteps(bothConfigured);

  // Display tips
  if (bothConfigured) {
    displayTips();
  }

  // Display resources
  displayResources();

  console.log('─'.repeat(80));
  
  if (bothConfigured) {
    console.log('🎉 You\'re all set! Run `npm run verify:ai` to get started.');
  } else {
    console.log('⚙️  Configure your providers, then come back to get started!');
  }
  
  console.log('─'.repeat(80));
  console.log('');
}

// Run the script
if (require.main === module) {
  main();
}

