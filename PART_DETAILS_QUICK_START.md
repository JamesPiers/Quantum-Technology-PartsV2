# Part Details Feature - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Run the Database Migration (Required)

**Action Required:** You must manually add two columns to your database.

1. Open your Supabase Dashboard
2. Go to: **SQL Editor** → **New Query**
3. Paste this SQL:

```sql
ALTER TABLE part_prices
ADD COLUMN document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
ADD COLUMN extraction_id UUID REFERENCES extractions(id) ON DELETE SET NULL;

CREATE INDEX idx_part_prices_document_id ON part_prices(document_id);
CREATE INDEX idx_part_prices_extraction_id ON part_prices(extraction_id);
```

4. Click **Run**
5. ✅ Done! The feature is now active.

**Direct Link to SQL Editor:**
`https://supabase.com/dashboard/project/gpwqmlolmgexvbfqunkf/sql/new`

---

### Step 2: Try It Out

1. **Navigate to Parts Page**
   - Go to `/parts` in your application
   - You'll see your parts table as before

2. **Click Any Part**
   - Notice the rows now have a hover effect
   - Click any row to open the detail view
   - You'll be taken to `/parts/{part-id}`

3. **Explore the Detail View**
   - See all part attributes
   - View current pricing
   - Browse price history
   - Click "View Quote" to see source documents

---

### Step 3: Upload a New Quote (See It In Action)

1. **Upload a Quote**
   - Go to `/upload`
   - Upload a supplier quote

2. **Review & Approve**
   - Go to `/review/{extractionId}`
   - Review the extraction
   - Click "Approve"

3. **Check the Part Details**
   - Go to `/parts`
   - Click on a part from that quote
   - You'll now see:
     - The price linked to your quote document
     - A "View Quote" button
     - The supplier information
     - When it was imported

---

## 📸 What You'll See

### Parts Table Page (`/parts`)
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  SKU      │ Part #   │ Name              ┃
┃━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┃
┃  SKU-001  │ ABC123   │ Widget Component  ┃  ← Clickable!
┃  SKU-002  │ XYZ789   │ Gear Assembly     ┃  ← Clickable!
┃  SKU-003  │ DEF456   │ Bearing Housing   ┃  ← Clickable!
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### Part Detail Page (`/parts/{id}`)
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ← Back to Parts                              ┃
┃                                               ┃
┃  Widget Component                    $45.50  ┃
┃  SKU: SKU-001  Part #: ABC123     Current Price
┃━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┃
┃                                               ┃
┃  Part Information                             ┃
┃  ┌─────────────────────────────────────────┐ ┃
┃  │ Description: High-quality widget comp.  │ ┃
┃  │                                         │ ┃
┃  │ Attributes:                             │ ┃
┃  │  Material: Steel    Color: Black        │ ┃
┃  │  Weight: 2.5kg      Size: Large         │ ┃
┃  └─────────────────────────────────────────┘ ┃
┃                                               ┃
┃  Price History                                ┃
┃  ┌─────────────────────────────────────────┐ ┃
┃  │ Price  │ Supplier │ Valid  │ [View Quote]│ ┃
┃  │$45.50✓ │ Acme Inc │ Today  │ [View Quote]│ ┃ ← Current
┃  │ $47.00 │ Acme Inc │ Jun'24 │ [View Quote]│ ┃
┃  │ $44.00 │ XYZ Corp │ May'24 │ [View Quote]│ ┃
┃  └─────────────────────────────────────────┘ ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## 🎯 Use Cases

### 1. **Price Comparison**
**Scenario:** You want to compare prices from different suppliers

**How:**
1. Go to `/parts`
2. Click the part you're interested in
3. Look at the "Price History" table
4. See all suppliers and their prices side-by-side
5. Use the "Pricing Summary" to see lowest/highest

---

### 2. **Quote Verification**
**Scenario:** Someone asks "What did Supplier X quote for Part Y?"

**How:**
1. Go to `/parts`
2. Click the part
3. Find the supplier in price history
4. Click "View Quote" to open the original document
5. Verify details in the actual quote

---

### 3. **Price Trend Analysis**
**Scenario:** You want to know if a part's price is going up or down

**How:**
1. Go to `/parts`
2. Click the part
3. Look at price history ordered by date
4. See the trend: is it increasing or decreasing?
5. Check the "Pricing Summary" for min/max

---

### 4. **Audit Trail**
**Scenario:** Need to prove when/why a price changed

**How:**
1. Go to `/parts`
2. Click the part
3. Price history shows:
   - Exact date price was added
   - Valid from/to dates
   - Source document
   - Supplier information
4. Click "View Quote" for proof

---

## 🔍 Understanding the Current Price

The system automatically determines the "current" price using this logic:

1. **First Priority:** Prices where `valid_from ≤ today ≤ valid_through`
   - If multiple match, picks most recent

2. **Fallback:** If no valid prices, uses the most recently added price

3. **Visual Indicator:** Current price shows a green "Current" badge

**Example:**
```
Price    Valid From    Valid Through    Status
$45.00   Jan 1, 2024   Dec 31, 2024    ← CURRENT ✓
$42.00   Jun 1, 2023   Dec 31, 2023    (expired)
$40.00   Jan 1, 2023   May 31, 2023    (expired)
```

---

## 💡 Tips & Tricks

### Tip 1: Use the Search
The parts table has search and filters. Use them to find parts quickly, then click to see details.

### Tip 2: Compare Suppliers
When a part has prices from multiple suppliers, you can see them all at once in the price history.

### Tip 3: Check Lead Times
The detail view shows lead times for each price. Use this to plan orders.

### Tip 4: Keep Quotes
Since every price links back to a quote, keep your quote documents in the system for full traceability.

### Tip 5: Monitor Price Changes
Check parts periodically to see if prices have changed. The history will show the trend.

---

## ❓ FAQ

**Q: What if a part has no prices?**
A: The detail page will show "No pricing information available". Prices are added when quotes are approved.

**Q: Can I edit prices?**
A: Not directly in the detail view. Prices come from approved extractions. To add a price, upload and approve a new quote.

**Q: What happens to old prices?**
A: They stay forever! The full history is maintained for record-keeping.

**Q: Can I delete a price?**
A: Prices can be deleted from the database, but it's recommended to keep them for audit purposes.

**Q: What if "View Quote" doesn't work?**
A: This means the document file is missing from storage or the price was created before this feature was added.

**Q: How do I know which price is current?**
A: Look for the green "Current" badge in the price history table, or check the top-right corner of the page.

**Q: Can I have multiple current prices?**
A: Only one price is marked as "current" - the most recent valid one.

**Q: What if a part has the same price from two quotes?**
A: Both records will show. Each maintains its own link to its source document.

---

## 🆘 Troubleshooting

### Issue: "Part not found"
**Solution:** The part ID in the URL is invalid. Go back to `/parts` and click a part from the table.

### Issue: Can't click on parts
**Solution:** Make sure you clicked the row itself, not a text selection. The whole row should be clickable.

### Issue: No supplier information showing
**Solution:** The part price might not have an associated supplier. Check the database.

### Issue: Price history is empty
**Solution:** This part doesn't have any prices yet. Upload and approve a quote containing this part.

---

## ✅ Success Checklist

- [ ] Database migration completed
- [ ] Can navigate to `/parts` page
- [ ] Can click on a part row
- [ ] Detail page loads with part information
- [ ] Can see attributes displayed
- [ ] Price history shows (if prices exist)
- [ ] Can click "View Quote" buttons
- [ ] Current price is highlighted
- [ ] Can navigate back to parts list
- [ ] Tried uploading a new quote and seeing it linked

---

## 📞 Need Help?

Refer to these documentation files:
- **`PART_DETAILS_FEATURE.md`** - Complete technical documentation
- **`IMPLEMENTATION_SUMMARY.md`** - What was built and why

---

## 🎊 You're Ready!

That's it! You now have a complete part detail system with price history tracking.

**Next Steps:**
1. Run the migration (Step 1)
2. Try clicking some parts (Step 2)
3. Upload a new quote to see it all work (Step 3)

Enjoy your new feature! 🚀

