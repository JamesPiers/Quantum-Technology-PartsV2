# Testing Guide - Quantum Technology V2

## 🎯 Quick Start Testing (5 Minutes)

Your application is now running on **http://localhost:3000**

### Test Scenario: Upload and Extract a Supplier Quote

#### Step 1: Access the Home Page
1. Open your browser and go to: **http://localhost:3000**
2. You should see the home page with three main cards:
   - Upload Quotes
   - Manage Parts
   - Create Orders

#### Step 2: Upload a Quote
1. Click **"Go to Upload"** or navigate to: **http://localhost:3000/upload**
2. Enter a Supplier ID (use one of these from seed data):
   ```
   00000000-0000-0000-0000-000000000001  (Acme Manufacturing)
   00000000-0000-0000-0000-000000000002  (Global Parts Co.)
   00000000-0000-0000-0000-000000000003  (Precision Machining)
   ```
3. **Upload ANY PDF file** (the mock provider will return sample data regardless of content)
4. Click **"Upload and Extract"**
5. Wait for the extraction to complete (should take < 1 second with mock provider)

#### Step 3: Review the Extraction
1. You'll be redirected to: **http://localhost:3000/review/[extractionId]**
2. Left side: PDF viewer (placeholder for now)
3. Right side: Extracted data showing:
   - **Supplier Information:**
     - Supplier Name: "Mock Supplier Inc."
     - Quote Number: "Q-2024-001"
     - Quote Date: "2024-01-15"
     - Currency: "USD"
     - Valid Until: "2024-02-15"
   - **Line Items (3 sample parts):**
     - Mock Part 1 - Aluminum Widget
     - Mock Part 2 - Steel Bracket
     - Mock Part 3 - Plastic Connector
   - Each with quantity breaks and pricing

4. Click **"Approve"** button

#### Step 4: Verify Parts Created
1. You'll be redirected to: **http://localhost:3000/parts**
2. You should see:
   - The 3 original seeded parts (SKU-ALU-001, SKU-STL-001, SKU-PLS-001)
   - Plus the 3 newly imported parts from the extraction (MOCK-001, MOCK-002, MOCK-003)

#### Step 5: Search Parts
1. Use the search bar to filter parts:
   - Try: "MOCK" - should show only the mock parts
   - Try: "Aluminum" - should show aluminum parts
   - Try: "SKU-" - should show seeded parts

#### Step 6: Create an Order
1. Navigate to: **http://localhost:3000/orders**
2. Click **"New Order"** button
3. Enter a customer name (optional): e.g., "Test Customer Inc."
4. Click **"Create Order"**
5. Your new order appears in the list

#### Step 7: Add Items to Order
1. Click **"View Details"** on your newly created order
2. Click **"Add Item"** button
3. Enter:
   - **Part ID**: `10000000-0000-0000-0000-000000000001` (Aluminum Widget from seed data)
   - **Supplier ID**: `00000000-0000-0000-0000-000000000001` (Acme Manufacturing)
   - **Quantity**: `100`
   - **Unit Price**: `9.25` (or leave blank to auto-fetch from database)
4. Click **"Add Item"**
5. The item appears in the order with calculated total
6. The subtotal updates automatically

---

## 🧪 Detailed Testing Scenarios

### Scenario 1: Multiple Extractions
1. Upload 3-5 different PDFs
2. Each should create a separate extraction
3. Review and approve each one
4. Verify parts are created/updated correctly
5. Check for duplicate handling (SKU conflicts)

### Scenario 2: Reject Extraction
1. Upload a PDF
2. In the review page, click **"Reject"** instead of approve
3. Verify the extraction status changes to "rejected"
4. Verify NO parts are created

### Scenario 3: Order Management
1. Create multiple orders with different customer names
2. Add various parts to each order
3. Test quantity and price overrides
4. Delete items from orders
5. Delete entire orders

### Scenario 4: Parts Search and Filtering
1. Navigate to Parts page
2. Test search with:
   - SKU numbers
   - Part numbers
   - Part names
   - Partial matches
3. Verify search results update in real-time

### Scenario 5: Price Selection
1. Create an order
2. Add a part that has multiple price points (like Aluminum Widget)
3. Leave unit_price blank when adding
4. Verify the system auto-selects the latest valid price

---

## 🔍 What to Look For

### ✅ Expected Behaviors

**Upload Page:**
- Drag & drop works
- File name displays after selection
- Upload button disabled until file and supplier ID provided
- Loading state shows during upload/extraction
- Redirects to review page after success

**Review Page:**
- All extracted data displays correctly
- Line items show with pricing tiers
- Approve button creates parts and prices
- Reject button marks extraction as rejected
- Toast notifications appear for success/error

**Parts Page:**
- All parts display in cards
- Search filters results instantly
- Each part shows: name, SKU, part number, description
- Pagination info shows at bottom

**Orders Page:**
- New orders can be created
- Orders list shows all orders
- Each order shows type, status, currency, created date
- View Details button navigates to order detail

**Order Detail Page:**
- Shows order information
- Lists all items with quantities and prices
- Subtotal calculates correctly
- Can add/remove items
- Prices can be overridden manually

### ❌ Common Issues and Solutions

**Issue: "Document not found" error**
- **Cause:** Extraction ID in URL is invalid
- **Solution:** Upload a new PDF and use the generated extraction ID

**Issue: "Supplier not found" when uploading**
- **Cause:** Invalid supplier UUID
- **Solution:** Use one of the seeded supplier IDs listed above

**Issue: "No valid price found" when adding order item**
- **Cause:** Part/supplier combination has no active prices
- **Solution:** Provide unit_price manually or use a part with existing prices

**Issue: Parts page is empty**
- **Cause:** No extractions have been approved yet
- **Solution:** Upload and approve at least one extraction

**Issue: Upload fails silently**
- **Cause:** Storage bucket policies or network issues
- **Solution:** Check browser console for errors, verify Supabase storage is set up

---

## 📊 Database Verification

### Check Tables Directly in Supabase

1. Go to: https://supabase.com/dashboard/project/gpwqmlolmgexvbfqunkf/editor

2. **Suppliers Table:**
   - Should have 3 rows from seed data
   - Click on any row to see details

3. **Parts Table:**
   - Should have 3 rows from seed data initially
   - After approving extractions, will have more

4. **Part Prices Table:**
   - Should have 4 rows from seed data
   - After approving extractions, will have more

5. **Documents Table:**
   - One row per PDF upload
   - Status should be: uploaded → processing → completed

6. **Extractions Table:**
   - One row per extraction
   - Status: pending_review → approved/rejected
   - Check raw_json and normalized_json fields

7. **Orders Table:**
   - One row per created order
   - Check type, status, currency

8. **Order Items Table:**
   - One row per item added to orders
   - Verify quantities and prices

---

## 🎨 UI/UX Testing

### Navigation
- [ ] All nav links work (Upload, Parts, Orders)
- [ ] Logo/title links to home page
- [ ] Back button works in browser
- [ ] Direct URL access works for all pages

### Responsive Design
- [ ] Test on different screen sizes
- [ ] Mobile view works correctly
- [ ] Cards stack properly on small screens
- [ ] Forms are usable on mobile

### Loading States
- [ ] Spinner shows during file upload
- [ ] "Loading..." appears when fetching data
- [ ] Buttons disabled during operations
- [ ] No layout shift during loading

### Error Handling
- [ ] Error messages are clear and helpful
- [ ] Toast notifications appear for errors
- [ ] Can recover from errors without refresh
- [ ] Network errors are caught

---

## 🚀 Performance Testing

### Speed Checks
- [ ] Home page loads instantly
- [ ] Parts page loads in < 1 second
- [ ] Search results appear instantly
- [ ] Upload completes in < 2 seconds (with mock)
- [ ] Page transitions are smooth

### Data Volume
1. Create 50+ parts (approve multiple extractions)
2. Create 20+ orders
3. Verify performance remains good
4. Check pagination works correctly

---

## 🔒 Security Testing

### Basic Security Checks
- [ ] Environment variables not exposed in browser
- [ ] API endpoints require valid data
- [ ] Invalid UUIDs are rejected
- [ ] SQL injection attempts fail
- [ ] XSS attempts are escaped

---

## 📝 Test Checklist

Copy this checklist and mark off as you test:

### Core Functionality
- [ ] Upload PDF successfully
- [ ] Extraction returns data (mock provider)
- [ ] Review page displays extraction
- [ ] Approve creates parts and prices
- [ ] Reject marks extraction as rejected
- [ ] Parts page shows all parts
- [ ] Search filters parts
- [ ] Create order successfully
- [ ] Add items to order
- [ ] Order totals calculate correctly
- [ ] Delete order item
- [ ] Delete order

### Edge Cases
- [ ] Upload without supplier ID (should error)
- [ ] Upload non-PDF file (should error)
- [ ] Approve extraction twice (should handle gracefully)
- [ ] Add same part to order twice (should work)
- [ ] Create order with no items (should work)
- [ ] Search with special characters
- [ ] Very long part names display correctly

### Integration
- [ ] Full flow: Upload → Review → Approve → Create Order → Add Parts
- [ ] Multiple users/sessions (if applicable)
- [ ] Page refresh preserves state (via TanStack Query)
- [ ] Browser back/forward works correctly

---

## 🎓 Next Steps After Testing

1. **Switch to Real AI Provider:**
   - Change `USE_PROVIDER=openai` in .env.local
   - Add `OPENAI_API_KEY=sk-...`
   - Upload real supplier quotes
   - Compare extraction quality

2. **Customize for Your Needs:**
   - Adjust the normalized schema
   - Add custom fields to tables
   - Modify UI to match branding
   - Add custom validation rules

3. **Deploy to Production:**
   - Follow DEPLOYMENT.md
   - Set up on Vercel
   - Configure production environment variables
   - Test in production environment

4. **Add Authentication:**
   - Set up Supabase Auth
   - Implement login/signup UI
   - Add user-specific RLS policies
   - Create admin dashboard

---

## 💡 Tips

- **Use Browser DevTools**: Open console (F12) to see logs and errors
- **Check Network Tab**: See all API calls and responses
- **Supabase Logs**: View real-time logs in Supabase dashboard
- **Test Early, Test Often**: Test each feature as you develop
- **Keep Sample Data**: The seed data is perfect for testing

---

## 🐛 Found a Bug?

1. Note the steps to reproduce
2. Check browser console for errors
3. Check Supabase logs
4. Check server logs (terminal where `npm run dev` is running)
5. Create a GitHub issue with details

---

## ✅ Success Criteria

Your setup is working correctly if you can:
1. ✅ Upload a PDF without errors
2. ✅ See extracted data in review page
3. ✅ Approve extraction and create parts
4. ✅ Find parts in the parts catalog
5. ✅ Create an order with items
6. ✅ See correct pricing and totals

**If all of the above work, congratulations! Your system is fully operational! 🎉**

