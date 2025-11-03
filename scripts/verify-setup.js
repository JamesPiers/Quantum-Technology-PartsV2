/**
 * Verify environment setup and Supabase connection
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying setup...\n');

// Check .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found!');
  console.log('Please create .env.local with your Supabase credentials.');
  process.exit(1);
}

// Load environment variables
require('dotenv').config({ path: envPath });

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

let allVarsPresent = true;
requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`❌ Missing: ${varName}`);
    allVarsPresent = false;
  } else {
    const value = process.env[varName];
    const masked = varName.includes('KEY') 
      ? value.substring(0, 10) + '...' 
      : value;
    console.log(`✅ ${varName}: ${masked}`);
  }
});

if (!allVarsPresent) {
  console.error('\n❌ Some environment variables are missing!');
  process.exit(1);
}

console.log('\n✅ Environment variables configured!');
console.log(`\n📦 Using provider: ${process.env.USE_PROVIDER || 'mock (default)'}`);

console.log('\n📋 Next steps:');
console.log('1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql');
console.log('2. Run migrations in this order:');
console.log('   - supabase/migrations/20240101000000_initial_schema.sql');
console.log('   - supabase/storage-setup.sql');
console.log('   - supabase/seed.sql (optional sample data)');
console.log('3. Run: npm run dev');
console.log('4. Visit: http://localhost:3000\n');

