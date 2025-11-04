# AI Provider Comparison Guide

This guide explains how to test and compare OpenAI and Google Document AI extraction providers with your real PDF documents.

## Prerequisites

1. **Environment Setup**: Ensure your `.env.local` file contains the following credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Google Document AI
GOOGLE_PROJECT_ID=your_project_id
GOOGLE_LOCATION=us
GOOGLE_PROCESSOR_ID=your_processor_id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
USE_PROVIDER=mock  # Change to 'openai' or 'docai' to set default
```

2. **Development Server**: Make sure your Next.js development server is running:
```bash
npm run dev
```

## Testing Methods

### Method 1: Single PDF Comparison

Test a single PDF with both providers and see detailed side-by-side comparison:

```bash
npm run compare:single -- path/to/your/document.pdf
```

**What it does:**
- Uploads the PDF to your system
- Runs extraction with OpenAI
- Runs extraction with Document AI
- Displays detailed comparison including:
  - Performance metrics (response time, token usage)
  - Completeness scores
  - Field-by-field comparison
  - Line items comparison
  - Quantity breaks analysis

**Example Output:**
```
📊 EXTRACTION COMPARISON RESULTS
================================================================================
📈 PERFORMANCE METRICS
Metric                         | OpenAI                    | Document AI
--------------------------------------------------------------------------------
Response Time                  | 3500 ms                   | 2800 ms
Completeness Score             | 87.5%                     | 75.0%
Line Items Count               | 15                        | 14

📄 EXTRACTED DATA
Field                          | OpenAI                    | Document AI          
--------------------------------------------------------------------------------
supplier_name                  | Acme Manufacturing        | Acme Manufacturing    ✅
quote_number                   | Q-2024-001                | Q2024001              ⚠️
currency                       | USD                       | USD                   ✅
```

### Method 2: Batch Testing Multiple PDFs

Test multiple PDFs at once and get aggregate statistics:

```bash
npm run compare:batch -- path/to/pdfs/directory
```

**What it does:**
- Finds all PDF files in the specified directory
- Tests each PDF with both providers
- Generates comprehensive comparison report
- Calculates aggregate statistics
- Provides cost estimates
- Recommends which provider to use
- Saves results to JSON file for further analysis

**Example Output:**
```
📊 BATCH COMPARISON REPORT
================================================================================
📈 OVERALL STATISTICS
Total PDFs Tested: 10
Successful Tests: 10
Failed Tests: 0

⚡ PERFORMANCE COMPARISON
Metric                              | OpenAI         | Document AI    | Winner
--------------------------------------------------------------------------------
Avg Response Time                   | 3200 ms        | 2500 ms        | Document AI
Avg Completeness Score              | 85.5%          | 78.2%          | OpenAI
Avg Line Items Extracted            | 12.5           | 11.8           | OpenAI

💰 COST CONSIDERATIONS:
   OpenAI:      Total tokens: 45,000  →  Estimated cost: $0.45
   Document AI: Total pages: ~10      →  Estimated cost: $0.015
```

## Understanding the Results

### Performance Metrics

- **Response Time**: How long the extraction took (lower is better)
- **Token Usage**: Only applicable to OpenAI (affects cost)
- **Completeness Score**: Percentage of expected fields successfully extracted (higher is better)
- **Fields Present**: Count of non-empty fields extracted
- **Line Items Count**: Number of parts/items extracted from the quote

### Data Quality Indicators

- ✅ Green checkmark: Values match between providers
- ⚠️ Warning symbol: Values differ between providers (requires manual review)

### What to Look For

1. **Accuracy**: Do the extracted values match your PDF content?
2. **Completeness**: Are all important fields being captured?
3. **Consistency**: Do both providers extract the same information?
4. **Line Items**: Are all parts and their pricing tiers captured correctly?
5. **Speed**: Which provider is faster for your use case?

## Making Your Decision

### Choose OpenAI if:
- ✅ You need higher completeness scores
- ✅ You want more detailed extraction
- ✅ Your PDFs have complex layouts or varied formats
- ✅ You process fewer documents (cost-effective for low volume)

### Choose Document AI if:
- ✅ Speed is your priority
- ✅ You have high document volume (more cost-effective at scale)
- ✅ Your PDFs follow a consistent format
- ✅ You need structured document processing

### Cost Comparison

**OpenAI (GPT-4 Turbo)**
- ~$0.01 per 1,000 input tokens
- ~$0.03 per 1,000 output tokens
- Average document: 3,000-5,000 tokens (~$0.04-$0.08 per document)

**Google Document AI**
- $1.50 per 1,000 pages
- Average quote: 1-3 pages (~$0.0015-$0.0045 per document)
- Much cheaper at volume

## Switching Providers

### Temporary (for testing):
```bash
# Test with OpenAI
curl -X POST http://localhost:3000/api/extract \
  -H "Content-Type: application/json" \
  -d '{"documentId": "your-doc-id", "provider": "openai"}'

# Test with Document AI
curl -X POST http://localhost:3000/api/extract \
  -H "Content-Type: application/json" \
  -d '{"documentId": "your-doc-id", "provider": "docai"}'
```

### Permanent (set default):
Update `.env.local`:
```env
USE_PROVIDER=openai   # or 'docai'
```

## Troubleshooting

### OpenAI Issues
- **Rate limiting**: OpenAI has rate limits. Add delays between requests if needed.
- **Token limits**: Very large PDFs may exceed token limits. Consider splitting.
- **API errors**: Check your API key is valid and has sufficient credits.

### Document AI Issues
- **Processor not found**: Ensure GOOGLE_PROCESSOR_ID is correct.
- **Authentication errors**: Verify your service account key file path.
- **Region errors**: Match GOOGLE_LOCATION with your processor's location.

### General Issues
- **Upload failures**: Check Supabase storage is configured correctly.
- **Timeout errors**: Increase timeout limits for large documents.
- **Missing data**: Some PDFs may have unusual formats requiring custom handling.

## Advanced Usage

### Export Results for Analysis
Batch comparison automatically saves results to JSON:
```bash
scripts/comparison-results-2024-11-04T10-30-00-000Z.json
```

You can analyze this data further using your preferred tools (Excel, Python, etc.)

### Custom Metrics
Edit `lib/utils/metrics.ts` to add custom accuracy calculations:
```typescript
export function calculateAccuracyMetrics(
  normalized: NormalizedExtraction,
  responseTimeMs: number,
  tokenUsage?: number
): AccuracyMetrics {
  // Add your custom metrics here
}
```

## Next Steps

1. **Run single comparison** with a representative sample PDF
2. **Review results** and check for accuracy
3. **Run batch comparison** with 5-10 varied PDFs
4. **Analyze the aggregate statistics**
5. **Choose your provider** based on your priorities (accuracy vs speed vs cost)
6. **Update `.env.local`** with your chosen default provider
7. **Monitor performance** in production and adjust as needed

## Support

If you encounter issues or need help interpreting results:
1. Check the logs in your terminal
2. Review the extraction records at `/review/[extractionId]`
3. Examine the raw JSON output in the database
4. Check the accuracy metrics stored with each extraction

## Resources

- [OpenAI Structured Outputs Documentation](https://platform.openai.com/docs/guides/structured-outputs)
- [Google Document AI Documentation](https://cloud.google.com/document-ai/docs)
- [Project Testing Guide](./TESTING_GUIDE.md)

