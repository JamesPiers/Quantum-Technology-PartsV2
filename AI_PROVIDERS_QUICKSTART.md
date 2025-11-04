# AI Providers Quick Start Guide

Ready to test your PDFs with real AI extraction? This guide will get you up and running in minutes.

## 🚀 Quick Start (5 Minutes)

### Step 1: Verify Your Setup

First, make sure both AI providers are properly configured:

```bash
npm run verify:ai
```

This will test:
- ✅ OpenAI API connection
- ✅ Google Document AI access
- ✅ Credentials validity
- ✅ Basic extraction capabilities

**Expected Output:**
```
🎉 Both providers are ready!
```

If you see errors, check the configuration section below.

### Step 2: Test with a Single PDF

Compare both providers with one document:

```bash
npm run compare:single -- /path/to/your/quote.pdf
```

**Example:**
```bash
npm run compare:single -- ~/Documents/sample-quote.pdf
```

This will:
1. Upload your PDF
2. Extract with OpenAI
3. Extract with Document AI
4. Show detailed side-by-side comparison

### Step 3: Test Multiple PDFs (Optional)

If you have several test documents:

```bash
npm run compare:batch -- /path/to/pdfs/directory
```

This will test all PDFs in the directory and generate a comprehensive report.

## 📋 What You'll See

### Single PDF Comparison Output

```
📊 EXTRACTION COMPARISON RESULTS
================================================================================

📈 PERFORMANCE METRICS
─────────────────────────────────────────────────────────────────────────────
Metric                         | OpenAI                    | Document AI
─────────────────────────────────────────────────────────────────────────────
Response Time                  | 3500 ms                   | 2800 ms
Token Usage                    | 4,523                     | N/A (billed by page)
Completeness Score             | 87.5%                     | 75.0%
Fields Present                 | 7/8                       | 6/8
Line Items Count               | 15                        | 14

📄 EXTRACTED DATA
─────────────────────────────────────────────────────────────────────────────
Field                          | OpenAI                    | Document AI          
─────────────────────────────────────────────────────────────────────────────
supplier_name                  | Acme Manufacturing        | Acme Manufacturing    ✅
quote_number                   | Q-2024-001                | Q2024001              ⚠️
quote_date                     | 2024-01-15                | 2024-01-15            ✅
currency                       | USD                       | USD                   ✅
valid_until                    | 2024-02-15                | -                     ⚠️

📦 LINE ITEMS COMPARISON
─────────────────────────────────────────────────────────────────────────────
OpenAI: 15 items | Document AI: 14 items

Item #1:
  OpenAI:
    Part #: WIDGET-001
    Description: Aluminum Widget Assembly
    UOM: EA
    Lead Time: 14 days
    MOQ: 100
    Qty Breaks: 3
      - 1+ units @ $15.50
      - 100+ units @ $14.25
      - 500+ units @ $12.75

  Document AI:
    Part #: WIDGET-001
    Description: Aluminum Widget Assembly
    UOM: EA
    Lead Time: 14 days
    MOQ: 100
    Qty Breaks: 2
      - 1+ units @ $15.50
      - 100+ units @ $14.25

📝 SUMMARY
─────────────────────────────────────────────────────────────────────────────
Completeness:
  OpenAI:      87.5% 🏆
  Document AI: 75.0%

Speed:
  OpenAI:      3500ms
  Document AI: 2800ms ⚡

Line Items Extracted:
  OpenAI:      15 📦
  Document AI: 14
```

## 🌐 Using the Web UI

You can also test through the web interface:

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Open the upload page:**
   ```
   http://localhost:3000/upload
   ```

3. **Select your provider:**
   - 🧪 Mock Data (for testing)
   - 🧠 OpenAI (GPT-4 Turbo)
   - ☁️ Document AI (Google Cloud)

4. **Upload and extract:**
   - Drag & drop your PDF
   - Click "Upload and Extract"
   - Review the results

## ⚙️ Configuration

### OpenAI Setup

1. **Get your API key:**
   - Visit https://platform.openai.com/api-keys
   - Create a new API key
   - Make sure you have credits available

2. **Add to `.env.local`:**
   ```env
   OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
   ```

3. **Verify:**
   ```bash
   npm run verify:ai
   ```

### Document AI Setup

1. **Create a processor:**
   - Go to https://console.cloud.google.com/ai/document-ai
   - Create a new processor (Form Parser or Custom Extractor)
   - Note the Processor ID

2. **Create service account:**
   - Go to https://console.cloud.google.com/iam-admin/serviceaccounts
   - Create a service account
   - Grant "Document AI API User" role
   - Create and download JSON key

3. **Add to `.env.local`:**
   ```env
   GOOGLE_PROJECT_ID=your-project-id
   GOOGLE_LOCATION=us
   GOOGLE_PROCESSOR_ID=abc123def456
   GOOGLE_APPLICATION_CREDENTIALS=./google-service-account-key.json
   ```

4. **Verify:**
   ```bash
   npm run verify:ai
   ```

## 🎯 Making Your Decision

After testing, consider these factors:

### Accuracy & Completeness
- Which provider extracts more fields?
- Which handles your specific document format better?
- Are the extracted values accurate?

### Speed
- Which provider is faster?
- Does speed matter for your use case?

### Cost
- **OpenAI**: ~$0.04-$0.08 per document (varies by length)
- **Document AI**: ~$0.0015-$0.0045 per document (by page count)
- Which fits your budget and volume?

### Volume
- Processing 10 docs/day: OpenAI might be cheaper
- Processing 1000 docs/day: Document AI is likely cheaper

## 🔧 Troubleshooting

### OpenAI Issues

**"Invalid API key"**
- Check your API key is correct
- Ensure you're using the right key format (starts with `sk-`)
- Verify you have credits available

**"Rate limit exceeded"**
- Wait a moment between requests
- Upgrade your OpenAI plan for higher limits
- Add delays in batch processing

**"Token limit exceeded"**
- Your PDF is too large
- Try splitting very long documents

### Document AI Issues

**"Permission denied"**
- Verify service account has correct roles
- Check GOOGLE_APPLICATION_CREDENTIALS path is correct
- Ensure the credentials file is readable

**"Processor not found"**
- Double-check GOOGLE_PROCESSOR_ID
- Verify GOOGLE_LOCATION matches processor location
- Ensure processor is in the same project

**"Quota exceeded"**
- Check your GCP quotas and limits
- Request quota increase if needed

### General Issues

**"Document not found"**
- Ensure your dev server is running (`npm run dev`)
- Check Supabase connection is working
- Verify storage is configured correctly

**"Upload failed"**
- Check file is a valid PDF
- Ensure Supabase storage has correct permissions
- Try a smaller file first

## 📊 Advanced: Analyzing Results

### Batch Test Results

Batch tests save results to JSON:
```
scripts/comparison-results-2024-11-04T10-30-00-000Z.json
```

You can analyze this with:
- Excel/Google Sheets
- Python pandas
- Custom scripts

### Custom Metrics

Edit `lib/utils/metrics.ts` to add domain-specific accuracy metrics:

```typescript
export function calculateAccuracyMetrics(
  normalized: NormalizedExtraction,
  responseTimeMs: number,
  tokenUsage?: number
): AccuracyMetrics {
  // Add your custom validation logic
  const hasAllCriticalFields = 
    normalized.supplier_name &&
    normalized.quote_number &&
    normalized.line_items?.length > 0;

  return {
    // ... standard metrics
    critical_fields_complete: hasAllCriticalFields,
  };
}
```

## 🎓 Tips for Best Results

### Document Quality
- ✅ Use high-quality, clear PDFs
- ✅ Ensure text is selectable (not scanned images)
- ✅ Test with your actual supplier documents
- ❌ Avoid heavily formatted or unusual layouts

### Testing Strategy
1. Start with 3-5 representative documents
2. Test both providers on the same documents
3. Manually verify extraction accuracy
4. Look for patterns in what each provider handles well
5. Test edge cases (missing fields, unusual formats)

### Provider Selection
- **Start with OpenAI** if accuracy is critical
- **Switch to Document AI** if you need speed and volume
- **Use both** for critical documents (compare and reconcile)

## 📚 Next Steps

1. ✅ Run `npm run verify:ai`
2. ✅ Test with `npm run compare:single -- your-pdf.pdf`
3. ✅ Review the comparison results
4. ✅ Choose your preferred provider
5. ✅ Update `.env.local` with `USE_PROVIDER=openai` or `USE_PROVIDER=docai`
6. ✅ Test with your production workflow

## 🔗 Resources

- [Full Comparison Guide](./PROVIDER_COMPARISON_GUIDE.md)
- [Testing Guide](./TESTING_GUIDE.md)
- [Architecture Documentation](./ARCHITECTURE.md)
- [OpenAI Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)
- [Document AI Documentation](https://cloud.google.com/document-ai/docs)

## 💬 Need Help?

Check:
1. Script output for specific error messages
2. Console logs in the terminal
3. Extraction results in the database
4. Review page at `/review/[extractionId]`

Happy extracting! 🎉

