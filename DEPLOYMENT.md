# Deployment Guide

This guide covers deploying the Quantum Technology V2 application to Vercel with Supabase.

## Prerequisites

- GitHub account
- Vercel account
- Supabase account
- OpenAI API key (optional) or Google Cloud account (optional)

## Step 1: Set up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. Run the database migrations:
   - Navigate to SQL Editor in Supabase dashboard
   - Copy and run `supabase/migrations/20240101000000_initial_schema.sql`
   - Copy and run `supabase/storage-setup.sql`
   - (Optional) Copy and run `supabase/seed.sql` for sample data

3. Get your Supabase credentials:
   - Go to Project Settings > API
   - Copy your `Project URL` (NEXT_PUBLIC_SUPABASE_URL)
   - Copy your `anon public` key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - Copy your `service_role` key (SUPABASE_SERVICE_ROLE_KEY) - keep this secret!

## Step 2: Set up AI Provider (Optional)

### Option A: OpenAI

1. Get an API key from [platform.openai.com](https://platform.openai.com)
2. Set `USE_PROVIDER=openai` and `OPENAI_API_KEY=sk-...`

### Option B: Google Document AI

1. Create a Google Cloud project
2. Enable Document AI API
3. Create a processor (Form Parser or Custom Extractor)
4. Create a service account and download JSON key
5. Set the following environment variables:
   - `USE_PROVIDER=docai`
   - `GOOGLE_PROJECT_ID=your-project-id`
   - `GOOGLE_LOCATION=us`
   - `GOOGLE_PROCESSOR_ID=your-processor-id`
   - `GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json`

### Option C: Mock Provider (for testing)

Set `USE_PROVIDER=mock` - no additional setup required.

## Step 3: Deploy to Vercel

1. Push your code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/quantum-tech-v2.git
git push -u origin main
```

2. Import project in Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will automatically detect Next.js

3. Configure environment variables in Vercel:
   - Go to Project Settings > Environment Variables
   - Add all variables from `.env.example`:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   USE_PROVIDER=mock
   ```

   If using OpenAI:
   ```
   OPENAI_API_KEY=sk-...
   ```

   If using Google Document AI:
   ```
   GOOGLE_PROJECT_ID=your-project-id
   GOOGLE_LOCATION=us
   GOOGLE_PROCESSOR_ID=your-processor-id
   ```

   Note: For Google Cloud service account JSON, you have two options:
   - Upload the JSON file to Vercel's file storage
   - Convert the JSON to a base64 string and decode it in your code

4. Deploy:
   - Click "Deploy"
   - Wait for the build to complete
   - Your app will be live at `https://your-project.vercel.app`

## Step 4: Test the Deployment

1. Navigate to your deployed URL
2. Go to `/upload`
3. Enter one of the sample supplier IDs from seed data:
   - `00000000-0000-0000-0000-000000000001` (Acme Manufacturing)
   - `00000000-0000-0000-0000-000000000002` (Global Parts Co.)
   - `00000000-0000-0000-0000-000000000003` (Precision Machining)
4. Upload a PDF (the mock provider will return sample data)
5. Review the extraction and approve it
6. Check that parts are created successfully

## Step 5: Configure Domain (Optional)

1. In Vercel project settings, go to Domains
2. Add your custom domain
3. Follow Vercel's instructions to configure DNS

## Security Considerations

### Production Checklist

- [ ] Use strong, unique service role key
- [ ] Enable MFA on Supabase and Vercel accounts
- [ ] Configure proper Row Level Security policies
- [ ] Set up proper CORS policies in Supabase
- [ ] Use environment-specific API keys
- [ ] Enable Vercel's protection against DDoS
- [ ] Set up monitoring and alerts
- [ ] Configure rate limiting on API routes
- [ ] Review and audit storage bucket policies

### Supabase RLS Policies

The current RLS policies allow all authenticated users to read/write. For production, you should:

1. Create user roles (admin, user, read-only)
2. Implement role-based policies
3. Restrict sensitive operations to admin users
4. Add audit logging

Example policy for restricted access:
```sql
CREATE POLICY "Only admins can delete parts"
ON parts FOR DELETE
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'admin'
);
```

## Monitoring

### Vercel Analytics

Enable Vercel Analytics in your project settings to track:
- Page views
- Web vitals
- API response times

### Supabase Monitoring

Monitor in Supabase dashboard:
- Database performance
- Storage usage
- API request counts
- Error rates

### Application Logs

View logs in Vercel dashboard:
- Functions logs for API routes
- Build logs
- Runtime logs

## Troubleshooting

### Build Fails

- Check that all dependencies are in `package.json`
- Verify TypeScript types are correct
- Check environment variables are set

### API Routes Return 500

- Check Supabase credentials are correct
- Verify database tables exist
- Check logs in Vercel dashboard

### File Upload Fails

- Verify storage buckets exist in Supabase
- Check storage policies allow uploads
- Verify signed URL generation works

### Extraction Fails

- Check provider credentials (OpenAI/Google Cloud)
- Verify provider is set correctly in env vars
- Check logs for specific error messages
- Test with mock provider first

## Rollback

If something goes wrong:

1. In Vercel, go to Deployments
2. Find the last working deployment
3. Click the three dots menu
4. Select "Promote to Production"

## Scaling

As your application grows:

1. **Database**: Upgrade Supabase plan for more connections
2. **Storage**: Monitor storage usage and upgrade as needed
3. **Vercel**: Consider Pro plan for better performance
4. **AI Providers**: Monitor token usage and set budgets

## Support

For deployment issues:
- Vercel: [vercel.com/support](https://vercel.com/support)
- Supabase: [supabase.com/support](https://supabase.com/support)
- Application issues: Create a GitHub issue

