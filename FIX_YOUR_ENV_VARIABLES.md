# Fix Your Environment Variables

## 🔍 What I Found

You have all the right credentials set up, but the **variable names** don't match what the code expects!

## ✅ Quick Fix

Open your `.env.local` file and make these 3 changes:

### 1. Rename General Processor ID

**Find this line:**
```env
GOOGLE_DOC_AI_PROCESSOR_ID_GENERAL=abc123...
```

**Change to:**
```env
GOOGLE_PROCESSOR_ID=abc123...
```

### 2. Rename Invoice Processor ID

**Find this line:**
```env
GOOGLE_DOC_AI_PROCESSOR_ID_INVOICE=xyz789...
```

**Change to:**
```env
GOOGLE_PROCESSOR_ID_INVOICE=xyz789...
```

### 3. Rename Credentials Variable

**Find this line:**
```env
GOOGLE_APPLICATION_CREDENTIALS_JSON=...
```

**Change to:**
```env
GOOGLE_APPLICATION_CREDENTIALS=./google-service-account-key.json
```

⚠️ **Important for #3:** This should be a **file path**, not JSON content!

## 📄 If You Have JSON Content in the Variable

If your `GOOGLE_APPLICATION_CREDENTIALS_JSON` contains the actual JSON like:
```json
{
  "type": "service_account",
  "project_id": "...",
  "private_key_id": "...",
  ...
}
```

**Do this:**

1. Copy all that JSON content
2. Create a new file in your project root: `google-service-account-key.json`
3. Paste the JSON into that file
4. Save it
5. In `.env.local`, add:
   ```env
   GOOGLE_APPLICATION_CREDENTIALS=./google-service-account-key.json
   ```
6. Delete the old `GOOGLE_APPLICATION_CREDENTIALS_JSON` line

## 📋 Final `.env.local` Google Section Should Look Like:

```env
# Google Document AI
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_LOCATION=us
GOOGLE_PROCESSOR_ID=your-general-processor-id
GOOGLE_PROCESSOR_ID_INVOICE=your-invoice-processor-id
GOOGLE_APPLICATION_CREDENTIALS=./google-service-account-key.json
```

## ✅ After Making Changes

Run this to verify everything works:

```bash
npm run verify:ai
```

You should see:
```
✅ OpenAI:      Ready
✅ Document AI: Ready
```

Then you can test all 4 providers! 🎉

