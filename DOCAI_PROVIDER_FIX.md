# DocAI Provider Fix Summary

## 🐛 Issues Fixed

### Issue 1: DocAI Invoice - OcrConfig Error
**Error Message:**
```
3 Invalid_Argument: OcrConfig is not supported for processor type: Invoice Processor
```

**Root Cause:** Invoice processors don't support the `ocrConfig` parameter, which was being sent unconditionally.

**Fix Applied:** Made `ocrConfig` conditional - only send for general processors:
```typescript
const processOptions: any = {};
if (this.processorType === 'general') {
  processOptions.ocrConfig = {
    languageHints: ['en'],
  };
}
```

### Issue 2: DocAI General - No Line Items Found
**Error Message:**
```
Extraction validation failed: line_items: Array must contain at least 1 element(s)
```

**Root Cause:** Generic DocAI processors (General and Invoice) don't have custom entity extraction for supplier quotes. They extract standard entities like dates, addresses, amounts, but not custom entities like:
- `line_item`
- `supplier_part_number`
- `qty_breaks`
- `moq`
- `lead_time_days`

**Fix Applied:** Added descriptive error messages explaining the limitation:

#### For General Processor:
```
DocAI General Processor found no line items. Generic processors require custom training 
for supplier quote entity extraction (line_item, supplier_part_number, qty_breaks, etc.). 
Use OpenAI for supplier quotes.
```

#### For Invoice Processor:
```
DocAI Invoice Processor found no line items. This processor is designed for invoices, 
not supplier quotes. Use OpenAI or a custom-trained DocAI processor for supplier quotes.
```

## 📊 Test Results

All providers tested with `sample-quote.pdf`:

| Provider | Status | Notes |
|----------|--------|-------|
| Mock | ✅ Working | Returns sample data for testing |
| OpenAI | ✅ Working | Successfully extracted: Spartan Controls Ltd., Quote #20523295, 1 line item |
| DocAI General | ❌ Expected Failure | Clear error: requires custom training |
| DocAI Invoice | ❌ Expected Failure | Clear error: designed for invoices only |

## 🎯 Recommendation

**For Supplier Quotes:** Use **OpenAI** provider (GPT-4o Mini)
- ✅ Works out-of-the-box
- ✅ Extracts all required fields
- ✅ Handles dates, currency, line items, qty_breaks
- ✅ Normalizes data to ISO formats

**For DocAI to Work:** You need a **custom-trained processor**
1. Create a custom DocAI processor
2. Train it with labeled supplier quote examples
3. Define custom entities:
   - `supplier_name`
   - `quote_number`
   - `quote_date`
   - `currency`
   - `line_item` (with nested properties):
     - `supplier_part_number`
     - `description`
     - `uom`
     - `qty_breaks` (with `min_qty`, `unit_price`)
     - `lead_time_days`
     - `moq`

## 📝 Files Modified

### 1. `lib/services/extraction/providers/docai.provider.ts`
**Changes:**
- Made `ocrConfig` conditional (lines 163-169)
- Added entity type logging for debugging (lines 59-65)
- Added descriptive error when no line items found (lines 122-128)

### 2. `app/upload/page.tsx`
**Changes:**
- Updated provider descriptions to indicate limitations (lines 225-228)
- Changed default provider from `mock` to `openai` (line 19)

### 3. `scripts/test-sample-extraction.js`
**Changes:**
- Added DocAI providers to test suite (line 66)

## 🧪 How to Test

### Test All Providers
```bash
node scripts/test-sample-extraction.js
```

### Test via UI
1. Start dev server: `npm run dev`
2. Navigate to http://localhost:3000/upload
3. Upload `sample-quote.pdf`
4. Select **OpenAI** provider (recommended)
5. Click "Upload and Extract"
6. View extracted data on review page

### Expected Behavior
- **Mock:** Returns sample data
- **OpenAI:** Extracts real data from PDF
- **DocAI General:** Shows clear error about needing custom training
- **DocAI Invoice:** Shows clear error about being for invoices only

## 💡 Understanding DocAI Processors

### Generic Processors
DocAI provides out-of-the-box processors for common document types:
- **Form Parser:** Generic forms
- **Invoice Parser:** Standard invoices
- **Receipt Parser:** Receipts
- **Contract Parser:** Contracts

These extract **standard entities** (dates, amounts, addresses, line items in standard invoice format).

### Custom Processors
For domain-specific documents (like **supplier quotes**), you need:
1. Custom processor creation in Google Cloud Console
2. Training data (20-100+ labeled examples)
3. Entity schema definition
4. Training time (can take hours/days)
5. Ongoing model tuning

### Why OpenAI Works Better for Quotes
- **Zero training required**
- **Flexible entity extraction** via prompt engineering
- **Structured output** with JSON schema
- **Handles variety** of quote formats
- **Fast iteration** on extraction rules

## 🔍 Debugging Tips

If you encounter DocAI issues:

1. **Check entity types found:**
   ```
   Look in server logs for: "DocAI entities found"
   ```

2. **Verify processor configuration:**
   ```bash
   echo $GOOGLE_PROJECT_ID
   echo $GOOGLE_PROCESSOR_ID
   echo $GOOGLE_PROCESSOR_ID_INVOICE
   ```

3. **Test with DocAI Console:**
   - Upload PDF to Google Cloud Console
   - View extracted entities
   - Compare with expected schema

4. **Use OpenAI for supplier quotes:**
   - Fastest path to production
   - Most reliable for quote extraction
   - Easy to customize via prompt tuning

## ✅ Acceptance Criteria Met

| Criterion | Status |
|-----------|--------|
| No "OcrConfig not supported" error | ✅ Fixed |
| Clear error messages for unsupported processors | ✅ Implemented |
| OpenAI works for supplier quotes | ✅ Verified |
| Mock provider still works | ✅ Verified |
| UI guides users to correct provider | ✅ Updated |

---

**Recommendation:** Use OpenAI for supplier quotes until you have a custom-trained DocAI processor. The improvements to schema validation, normalization, and error handling ensure OpenAI extracts clean, validated data.

