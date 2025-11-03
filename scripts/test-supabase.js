/**
 * Test Supabase connection and verify database setup
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testConnection() {
  console.log('🔗 Testing Supabase connection...\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Test database connection by checking tables
    console.log('📊 Checking database tables...');
    
    const tables = [
      'suppliers',
      'parts',
      'part_prices',
      'documents',
      'extractions',
      'orders',
      'order_items'
    ];

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);

      if (error) {
        console.error(`❌ Table "${table}" - Error: ${error.message}`);
        if (error.message.includes('does not exist')) {
          console.log(`   Run migrations in Supabase SQL Editor!`);
        }
      } else {
        console.log(`✅ Table "${table}" - OK`);
      }
    }

    // Test storage
    console.log('\n💾 Checking storage buckets...');
    const { data: buckets, error: bucketError } = await supabase
      .storage
      .listBuckets();

    if (bucketError) {
      console.error(`❌ Storage error: ${bucketError.message}`);
    } else {
      const expectedBuckets = ['supplier-docs', 'exports'];
      expectedBuckets.forEach(bucketName => {
        const found = buckets.find(b => b.name === bucketName);
        if (found) {
          console.log(`✅ Bucket "${bucketName}" - OK`);
        } else {
          console.error(`❌ Bucket "${bucketName}" - Missing (run storage-setup.sql)`);
        }
      });
    }

    console.log('\n✅ Supabase connection test complete!');
    
  } catch (error) {
    console.error('\n❌ Connection test failed:', error.message);
    process.exit(1);
  }
}

testConnection();

