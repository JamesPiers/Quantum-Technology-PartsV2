# Setup Instructions

## Supabase Database Setup

### Step 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/gpwqmlolmgexvbfqunkf/sql/new
2. Or navigate to: Dashboard → SQL Editor → New Query

### Step 2: Run Migrations (in order)

#### Migration 1: Create Tables
1. Open file: `supabase/migrations/20240101000000_initial_schema.sql`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click "Run" button
5. Wait for "Success" message

#### Migration 2: Create Storage Buckets
1. Open file: `supabase/storage-setup.sql`
2. Copy the entire contents
3. Paste into a new SQL query
4. Click "Run"
5. Wait for "Success" message

#### Migration 3: Add Sample Data (Optional)
1. Open file: `supabase/seed.sql`
2. Copy the entire contents
3. Paste into a new SQL query
4. Click "Run"
5. This adds 3 sample suppliers and 3 sample parts for testing

### Step 3: Verify Setup

Run in your terminal:
```bash
npm run test:supabase
```

This will check:
- ✅ All database tables exist
- ✅ Storage buckets are created
- ✅ Connection is working

### Step 4: Start Development Server

```bash
npm run dev
```

Then visit: http://localhost:3000

## Testing the Application

### Quick Test Flow

1. **Go to Upload Page**
   - Navigate to http://localhost:3000/upload

2. **Use Sample Supplier ID**
   - Use: `00000000-0000-0000-0000-000000000001` (Acme Manufacturing)
   - Or: `00000000-0000-0000-0000-000000000002` (Global Parts Co.)
   - Or: `00000000-0000-0000-0000-000000000003` (Precision Machining)

3. **Upload Any PDF**
   - The mock provider will return sample data regardless of PDF content
   - Actual PDF parsing only works with OpenAI/DocAI providers

4. **Review Extraction**
   - You'll be redirected to the review page
   - See extracted supplier info and line items
   - Click "Approve" to import into database

5. **View Parts**
   - Navigate to http://localhost:3000/parts
   - See the imported parts from the extraction

6. **Create Orders**
   - Navigate to http://localhost:3000/orders
   - Create a new order
   - Add parts to the order

## Troubleshooting

### "Table does not exist" error
- Run the migrations in Supabase SQL Editor
- Make sure all migrations completed successfully

### "Bucket not found" error
- Run the storage-setup.sql migration
- Check Storage section in Supabase dashboard

### Connection errors
- Verify .env.local has correct credentials
- Check Supabase project is active (not paused)
- Run `npm run verify` to check configuration

### Upload fails
- Make sure storage buckets exist
- Check RLS policies allow authenticated uploads
- Verify signed URL generation in Supabase logs

## Next Steps After Testing

1. **Configure Real AI Provider**
   - For OpenAI: Add `OPENAI_API_KEY` to .env.local
   - For Google DocAI: Add Google Cloud credentials
   - Change `USE_PROVIDER` from "mock" to "openai" or "docai"

2. **Deploy to Vercel**
   - See DEPLOYMENT.md for detailed instructions

3. **Set Up Authentication**
   - Implement login/signup UI
   - Configure Supabase Auth providers

4. **Customize**
   - Add your branding
   - Modify validation rules
   - Extend with custom features

