/**
 * Run the supplier_id nullable migration
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function runMigration() {
  console.log('🔧 Running migration: Make supplier_id nullable...\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Note: Supabase JS client doesn't support ALTER TABLE directly
    // We'll test if the change has been made by trying to insert a null value
    
    console.log('⚠️  This script cannot run ALTER TABLE commands.');
    console.log('Please run the following SQL in Supabase SQL Editor:\n');
    console.log('──────────────────────────────────────────────────');
    console.log('ALTER TABLE documents ALTER COLUMN supplier_id DROP NOT NULL;');
    console.log('──────────────────────────────────────────────────\n');
    console.log('📍 URL: https://supabase.com/dashboard/project/gpwqmlolmgexvbfqunkf/sql/new\n');

    // Test if migration has been run
    console.log('🧪 Testing if supplier_id is nullable...');
    
    const testDoc = {
      supplier_id: null,
      doc_type: 'quote',
      file_path: 'test/migration-test.pdf',
      status: 'uploaded',
    };

    const { data, error } = await supabase
      .from('documents')
      .insert(testDoc)
      .select()
      .single();

    if (error) {
      if (error.message.includes('null value') || error.message.includes('violates not-null')) {
        console.error('❌ Migration NOT applied yet - supplier_id is still required');
        console.log('\n🔧 Please run the SQL above in Supabase SQL Editor\n');
        process.exit(1);
      } else {
        console.error('❌ Different error:', error.message);
        process.exit(1);
      }
    }

    // Clean up test document
    if (data) {
      await supabase.from('documents').delete().eq('id', data.id);
      console.log('✅ Migration successful! supplier_id is now nullable');
      console.log('🎉 You can now upload files without entering a supplier ID\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

runMigration();

