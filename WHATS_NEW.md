# What's New: AI Provider Testing & Comparison

## 🎉 Overview

Your system now has comprehensive tools for testing and comparing **OpenAI** and **Google Document AI** extraction providers with real PDFs. You can move beyond mock data and see which AI provider works best for your supplier quote documents.

## ✨ New Features

### 1. **Provider Selection in Upload UI**
The upload page (`/upload`) now lets you choose which AI provider to use:
- 🧪 **Mock Data** - For testing (returns sample data)
- 🧠 **OpenAI** - GPT-4 Turbo for intelligent extraction
- ☁️ **Document AI** - Google Cloud for structured processing

### 2. **Single PDF Comparison Tool**
Compare both providers side-by-side with one document:
```bash
npm run compare:single -- path/to/your-quote.pdf
```

**What it shows:**
- Performance metrics (speed, tokens used)
- Completeness scores
- Field-by-field comparison
- Line items and quantity breaks
- Which provider performed better

### 3. **Batch Testing Tool**
Test multiple PDFs at once and get aggregate statistics:
```bash
npm run compare:batch -- path/to/pdfs/directory
```

**What it provides:**
- Aggregate performance metrics
- Success rates
- Average completeness scores
- Cost estimates
- Overall winner recommendation
- Exportable JSON results

### 4. **AI Provider Verification**
Quick check that both providers are configured correctly:
```bash
npm run verify:ai
```

**Verifies:**
- API credentials are valid
- Connections work
- Basic extraction capabilities
- Configuration is complete

## 📁 New Files Created

### Scripts
- `scripts/compare-extraction-providers.js` - Single PDF comparison
- `scripts/batch-compare-providers.js` - Batch testing
- `scripts/verify-ai-providers.js` - Configuration verification

### Documentation
- `AI_PROVIDERS_QUICKSTART.md` - Quick start guide (5 minutes to testing)
- `PROVIDER_COMPARISON_GUIDE.md` - Comprehensive comparison guide
- `WHATS_NEW.md` - This file

### Updated Files
- `app/upload/page.tsx` - Added provider selection UI
- `package.json` - Added npm scripts for easy testing

## 🚀 Quick Start

### Step 1: Verify Setup (30 seconds)
```bash
npm run verify:ai
```

If you see errors, check your `.env.local` has:
```env
# OpenAI
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx

# Google Document AI
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_LOCATION=us
GOOGLE_PROCESSOR_ID=your-processor-id
GOOGLE_APPLICATION_CREDENTIALS=./path-to-key.json
```

### Step 2: Test with One PDF (2 minutes)
```bash
npm run compare:single -- ~/Documents/sample-quote.pdf
```

You'll see a detailed comparison showing which provider performed better.

### Step 3: Make Your Decision
Based on the results, choose:
- **OpenAI** for higher accuracy and complex layouts
- **Document AI** for speed and cost at scale

Update your `.env.local`:
```env
USE_PROVIDER=openai  # or 'docai'
```

## 🎯 Use Cases

### During Development
```bash
# Use the web UI with provider selection
npm run dev
# Open http://localhost:3000/upload
# Select provider and test documents
```

### One-Time Testing
```bash
# Quick comparison of a single document
npm run compare:single -- path/to/quote.pdf
```

### Comprehensive Evaluation
```bash
# Test all your sample documents
npm run compare:batch -- path/to/test-pdfs/
# Review the generated JSON report
```

### Production Setup
```bash
# Verify everything is configured
npm run verify:ai
# Set your chosen provider in .env.local
# USE_PROVIDER=openai
```

## 📊 What Gets Compared

### Performance Metrics
- ⏱️ **Response Time** - How fast extraction completes
- 💰 **Token Usage** - OpenAI cost indicator
- 📈 **Completeness Score** - % of fields successfully extracted
- 📦 **Line Items Count** - Number of parts extracted

### Data Quality
- ✅ **Field Accuracy** - Are values correct?
- ✅ **Field Completeness** - Are all fields present?
- ✅ **Line Item Detail** - Part numbers, descriptions, pricing
- ✅ **Quantity Breaks** - Multiple price tiers captured?

### Cost Analysis
- **OpenAI**: Shows total tokens used and estimated cost
- **Document AI**: Shows page count and estimated cost
- **Comparison**: Which is more cost-effective for your volume?

## 🛠️ NPM Scripts

New scripts added to `package.json`:

```json
{
  "scripts": {
    "verify:ai": "Verify AI provider configuration",
    "compare:single": "Compare providers on one PDF",
    "compare:batch": "Compare providers on multiple PDFs"
  }
}
```

## 💡 Example Output

### Single Comparison
```
📊 EXTRACTION COMPARISON RESULTS
================================================================================

📈 PERFORMANCE METRICS
Metric                         | OpenAI          | Document AI    
─────────────────────────────────────────────────────────────────
Response Time                  | 3500 ms         | 2800 ms        
Completeness Score             | 87.5%           | 75.0%          
Line Items Count               | 15              | 14             

📝 SUMMARY
Completeness:  OpenAI: 87.5% 🏆
Speed:         Document AI: 2800ms ⚡
Line Items:    OpenAI: 15 📦
```

### Batch Comparison
```
📊 BATCH COMPARISON REPORT
================================================================================
Total PDFs Tested: 10
Successful Tests: 10

⚡ PERFORMANCE COMPARISON
Avg Response Time              | OpenAI: 3200ms  | Document AI: 2500ms ⚡
Avg Completeness Score         | OpenAI: 85.5% 🏆| Document AI: 78.2%
Avg Line Items Extracted       | OpenAI: 12.5 📦 | Document AI: 11.8

💰 COST CONSIDERATIONS
OpenAI:      45,000 tokens  →  $0.45
Document AI: ~10 pages      →  $0.015

🏆 OVERALL WINNER: OpenAI
   OpenAI performs better overall for your use case
```

## 📚 Documentation

### Quick Start (5 min read)
→ **AI_PROVIDERS_QUICKSTART.md**
- Get testing in 5 minutes
- Basic usage examples
- Quick troubleshooting

### Comprehensive Guide (15 min read)
→ **PROVIDER_COMPARISON_GUIDE.md**
- Detailed comparison methodology
- Advanced usage and analysis
- Cost breakdowns and decision factors

### Architecture & Technical Details
→ **ARCHITECTURE.md**
- System design
- Provider implementation details
- Extension points

## 🎓 Decision Framework

### Choose OpenAI if:
- ✅ Accuracy is critical
- ✅ Documents have varied/complex layouts
- ✅ You need detailed extraction
- ✅ Lower document volume (<100/day)

### Choose Document AI if:
- ✅ Speed is priority
- ✅ High volume processing (>1000/day)
- ✅ Cost-sensitive at scale
- ✅ Documents follow consistent format

### Use Both if:
- ✅ Critical business documents
- ✅ You need validation/reconciliation
- ✅ Quality assurance requirements
- ✅ Hybrid approach based on document type

## 🔄 Migration Path

Currently on Mock → Real AI:

1. **Week 1: Testing Phase**
   - Run `verify:ai` to confirm setup
   - Test with 5-10 representative PDFs
   - Review accuracy and completeness
   - Identify any extraction issues

2. **Week 2: Optimization**
   - Fine-tune prompts if needed (OpenAI)
   - Train custom processor if needed (Document AI)
   - Test edge cases
   - Document any special handling needed

3. **Week 3: Pilot**
   - Set default provider in `.env.local`
   - Process real documents
   - Monitor results
   - Gather user feedback

4. **Week 4: Production**
   - Full rollout with chosen provider
   - Set up monitoring
   - Track success metrics
   - Optimize based on real usage

## 🔍 What's Under the Hood

### Extraction Flow
1. **Upload** → PDF stored in Supabase Storage
2. **Download** → Provider downloads PDF via signed URL
3. **Extract** → AI processes document and extracts data
4. **Normalize** → Results converted to standard schema
5. **Store** → Saved to database with metrics
6. **Review** → User reviews and approves/edits

### Provider Implementations

**OpenAI Provider:**
- Extracts text from PDF using `pdf-parse`
- Sends to GPT-4 Turbo with structured output
- Uses JSON schema for type safety
- Returns normalized extraction + metrics

**Document AI Provider:**
- Sends PDF directly to Google Cloud
- Uses trained processor for extraction
- Normalizes Document AI entities to schema
- Returns extraction + metrics

**Mock Provider:**
- Returns sample data instantly
- Useful for UI testing and demos
- No external API calls

## 🧪 Testing Best Practices

1. **Start Small**: Test with 3-5 documents first
2. **Representative Samples**: Use actual supplier documents
3. **Verify Manually**: Check extraction accuracy by hand
4. **Test Edge Cases**: Missing fields, unusual formats
5. **Compare Side-by-Side**: Use comparison tools
6. **Monitor Costs**: Track API usage and costs
7. **Iterate**: Adjust based on results

## ⚠️ Important Notes

### API Keys & Credentials
- Never commit `.env.local` to git
- Keep API keys secure
- Rotate keys regularly
- Use separate keys for dev/prod

### Costs
- **OpenAI**: Pay per token (~$0.01/1K tokens)
- **Document AI**: Pay per page (~$1.50/1K pages)
- Monitor usage to avoid surprises
- Set up billing alerts

### Rate Limits
- **OpenAI**: Has rate limits based on plan
- **Document AI**: Has quota limits
- Add delays in batch processing if needed
- Handle rate limit errors gracefully

## 🎯 Next Steps

1. ✅ **Verify Setup**
   ```bash
   npm run verify:ai
   ```

2. ✅ **Test Single Document**
   ```bash
   npm run compare:single -- path/to/sample.pdf
   ```

3. ✅ **Review Results**
   - Check accuracy
   - Compare metrics
   - Note any issues

4. ✅ **Choose Provider**
   - Based on your priorities
   - Update `.env.local`
   - Document your decision

5. ✅ **Test in Web UI**
   ```bash
   npm run dev
   ```
   - Go to `/upload`
   - Test with both providers
   - Review extraction results

6. ✅ **Process Real Documents**
   - Start with pilot phase
   - Monitor results
   - Gather feedback
   - Scale up gradually

## 📞 Getting Help

### Check These First
1. Run `npm run verify:ai` for config issues
2. Check script output for error messages
3. Review documentation files
4. Check API provider dashboards

### Common Issues
- **Upload fails**: Check Supabase storage config
- **Extraction fails**: Verify API credentials
- **Slow processing**: Check PDF size and complexity
- **Low accuracy**: May need provider-specific tuning

## 🎉 You're Ready!

You now have everything needed to:
- ✅ Test both AI providers with real PDFs
- ✅ Compare results side-by-side
- ✅ Make data-driven provider decisions
- ✅ Move from mock data to production AI

Start with:
```bash
npm run verify:ai
npm run compare:single -- your-sample.pdf
```

Happy extracting! 🚀

