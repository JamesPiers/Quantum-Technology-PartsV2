# Extraction Fix Summary

## 🐛 Issue Found

The upload UI showed "Failed to start extraction" without revealing the actual error. Root cause: **OpenAI strict mode schema validation error**.

### Error Message
```
400 Invalid schema for response_format 'supplier_quote': 
In context=('properties', 'line_items', 'items'), 'required' is required to be supplied 
and to be an array including every key in properties. Missing 'uom'.
```

## ✅ Fix Applied

### 1. **OpenAI JSON Schema** (`lib/schemas/extraction.schema.ts`)
**Problem**: In OpenAI's strict mode, ALL properties must be in the `required` array, even nullable ones.

**Solution**: Updated `openAIJsonSchema` to include all properties in required arrays:
- Root level: `['supplier_name', 'quote_number', 'quote_date', 'currency', 'valid_until', 'notes', 'line_items']`
- Line items: `['supplier_part_number', 'description', 'uom', 'qty_breaks', 'lead_time_days', 'moq']`

Optional fields use `{ type: ['string', 'null'] }` instead of being omitted from required.

### 2. **Upload Page Error Handling** (`app/upload/page.tsx`)
**Problem**: Generic error message didn't show actual API error details.

**Solution**: Enhanced error handling to parse and display API error details:
```typescript
const errorData = await extractResponse.json().catch(() => ({ error: 'Failed to start extraction' }))
const errorMessage = errorData.details 
  ? `${errorData.error}: ${errorData.details}` 
  : errorData.message || errorData.error || 'Failed to start extraction'
throw new Error(errorMessage)
```

### 3. **Mock Provider Validation** (`lib/services/extraction/providers/mock.provider.ts`)
**Problem**: Mock provider wasn't validating with Zod schema like other providers.

**Solution**: Added schema validation for consistency:
```typescript
const validated = normalizedExtractionSchema.parse(normalized);
```

## 🧪 Test Results

### Sample PDF: `sample-quote.pdf` (183 KB)

#### Mock Provider ✅
- Supplier: Mock Supplier Inc.
- Currency: USD
- Line Items: 3
- All qty_breaks present

#### OpenAI Provider ✅
- Supplier: **Spartan Controls Ltd.** (extracted from PDF)
- Quote #: **20523295**
- Date: **2025-04-10** (ISO 8601 format)
- Currency: **CAD** (3-letter code, correctly detected)
- Line Items: 1
- Part #: CS-2384-9217832
- Description: FISHER CS200 Self Operating Regulator
- Qty Break: 1+ @ $810

## 📊 Acceptance Criteria (Re-verified)

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Endpoint returns only JSON matching schema | ✅ | OpenAI returned strict JSON, validated by Zod |
| DocAI uses fieldMask for compact payload | ✅ | Implemented in previous fix |
| Line items have qty_breaks | ✅ | Sample extraction shows qty_breaks: [{ min_qty: 1, unit_price: 810 }] |
| Dates are ISO format | ✅ | 2025-04-10 (not "April 10, 2025") |
| Currency is 3-letter code | ✅ | CAD (not "Canadian Dollar") |
| Bad extraction returns 400 with clear error | ✅ | Upload page now shows detailed validation errors |
| No file renames/restructures | ✅ | Only modified existing files + 1 test script |

## 🚀 How to Test

### Option 1: Use the UI (Recommended)
1. Start dev server: `npm run dev`
2. Open http://localhost:3000/upload
3. Upload `sample-quote.pdf`
4. Select provider (mock or openai)
5. Click "Upload and Extract"
6. Should redirect to review page with extracted data

### Option 2: Use the Test Script
```bash
node scripts/test-sample-extraction.js
```

This script tests both mock and OpenAI providers and displays detailed extraction results.

### Option 3: Manual API Testing
```bash
# 1. Get upload URL
UPLOAD=$(curl -X POST http://localhost:3000/api/upload \
  -H "Content-Type: application/json" \
  -d '{"fileName":"sample-quote.pdf","fileType":"application/pdf"}')

DOCUMENT_ID=$(echo "$UPLOAD" | jq -r '.documentId')
UPLOAD_URL=$(echo "$UPLOAD" | jq -r '.uploadUrl')

# 2. Upload PDF
curl -X PUT "$UPLOAD_URL" \
  -H "Content-Type: application/pdf" \
  --data-binary @sample-quote.pdf

# 3. Extract with OpenAI
curl -X POST http://localhost:3000/api/extract \
  -H "Content-Type: application/json" \
  -d "{\"documentId\":\"$DOCUMENT_ID\",\"provider\":\"openai\"}" | jq .
```

## 📝 Files Changed

1. **`lib/schemas/extraction.schema.ts`** - Fixed OpenAI strict mode schema
2. **`app/upload/page.tsx`** - Improved error message display
3. **`lib/services/extraction/providers/mock.provider.ts`** - Added Zod validation
4. **`scripts/test-sample-extraction.js`** - NEW: Diagnostic test script

## 🎯 Key Takeaways

1. **OpenAI Strict Mode**: In strict mode with `additionalProperties: false`, ALL properties (even nullable ones) must be in the `required` array.

2. **Error Transparency**: Always surface API error details in the UI for better debugging.

3. **Validation Consistency**: All providers should validate against the same Zod schema before returning data.

4. **Date/Currency Normalization**: The normalization utilities (`lib/utils/normalize.ts`) correctly handle:
   - Date formats → ISO 8601
   - Currency names → 3-letter codes
   - Relative dates ("valid 30 days") → computed ISO dates

## 🔍 Debugging Future Issues

If extraction fails:
1. Check browser console for the actual error message (now displayed)
2. Run `node scripts/test-sample-extraction.js` to test offline
3. Check server logs for validation errors
4. Verify schema changes don't break strict mode requirements

---

**Status**: ✅ All issues resolved. Extraction working for both mock and OpenAI providers.

