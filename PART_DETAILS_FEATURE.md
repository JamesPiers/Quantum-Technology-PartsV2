# Part Details & History Tracking Feature

## Overview

This feature adds comprehensive part detail views with full pricing history and quote tracking capabilities to the application. Users can now click on any part in the parts table to view complete information including attributes, supplier details, pricing history, and links to source documents.

## What's Been Implemented

### 1. Database Schema Updates

**New Migration**: `20240103000000_add_part_price_source_tracking.sql`

Added two new columns to the `part_prices` table:
- `document_id` - Links to the source document (quote) for this price
- `extraction_id` - Links to the extraction that created this price record

These columns enable full traceability from a price back to its source document, supporting audit trails and historical record-keeping.

### 2. Updated Type Definitions

**File**: `lib/types/database.types.ts`

Added new types:
- `PartPriceWithRelations` - Extends PartPrice with populated supplier, document, and extraction data
- `PartWithDetails` - Extends Part with all pricing history and current price information

### 3. Enhanced API Endpoint

**File**: `app/api/parts/[id]/route.ts`

The GET endpoint now returns:
- Complete part information
- All pricing history with related supplier, document, and extraction data
- Automatically determined "current price" (most recent valid price)

The endpoint intelligently selects the current price by:
1. Finding prices where `valid_from <= today <= valid_through`
2. Falling back to the most recently created price if no valid price is found

### 4. Updated Extraction Approval Flow

**File**: `app/api/extractions/[id]/approve/route.ts`

When extractions are approved, the system now automatically populates:
- `document_id` - Links the price to the source quote document
- `extraction_id` - Links the price to the extraction record

This ensures all future price records maintain full traceability.

### 5. Detailed Part View Page

**File**: `app/parts/[id]/page.tsx`

A comprehensive part detail page that displays:

#### Main Information Card
- Part name, SKU, and supplier part number
- Description and full attributes displayed in a grid
- Technical drawing link (if available)
- Creation date

#### Current Price Display
- Prominently displays the current/active price
- Shows MOQ (Minimum Order Quantity) if applicable
- Currency-formatted pricing

#### Price History Table
Shows all historical prices with:
- Price amount with visual indicator for current price
- Supplier name and contact information
- Valid date range (from/to)
- MOQ and lead time
- Link to source document (quote)
- Date the price was added

The current price is highlighted in green for easy identification.

#### Sidebar Information
- **Current Supplier Card**: Details about the supplier providing the current price
- **Pricing Summary**: Statistics including number of price records, number of suppliers, lowest/highest prices
- **Latest Quote Card**: Information about the most recent quote document with a direct link to view it

### 6. Clickable Parts Table

**File**: `app/parts/page.tsx`

The parts table now features:
- Clickable rows that navigate to the detailed view
- Hover effect for better UX
- Smooth transition to detail page

### 7. Updated React Hooks

**File**: `lib/hooks/use-parts.ts`

The `usePart` hook now properly types the response as `PartWithDetails`, ensuring full type safety throughout the application.

## User Experience Flow

1. **Browse Parts**: User views the parts catalog at `/parts`
2. **Select Part**: User clicks on any row in the table
3. **View Details**: User is taken to `/parts/{id}` showing comprehensive information
4. **Access History**: User can see all historical pricing and quotes
5. **View Documents**: User can click "View Quote" to open the source document

## Benefits

### Price History Tracking
- Track price changes over time for each part
- Maintain historical records for auditing
- Compare prices from different suppliers

### Quote Traceability
- Link every price back to its source document
- Easy access to original quotes for verification
- Maintain documentation chain for compliance

### Supplier Management
- View all suppliers who have quoted a part
- Compare lead times and MOQs across suppliers
- Access supplier contact information quickly

### Decision Support
- See price trends (highest/lowest)
- Identify the current valid price automatically
- Make informed purchasing decisions based on history

## Database Migration Instructions

⚠️ **IMPORTANT**: The database migration cannot be run automatically through the script. You need to manually run the SQL in your Supabase SQL Editor.

### Steps to Apply Migration:

1. Go to your Supabase Dashboard
2. Navigate to: **SQL Editor** → **New Query**
3. Copy and paste the following SQL:

```sql
-- Add columns to track the source document and extraction for each part price
ALTER TABLE part_prices
ADD COLUMN document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
ADD COLUMN extraction_id UUID REFERENCES extractions(id) ON DELETE SET NULL;

-- Create indexes for the new foreign keys
CREATE INDEX idx_part_prices_document_id ON part_prices(document_id);
CREATE INDEX idx_part_prices_extraction_id ON part_prices(extraction_id);

-- Add a comment to explain the relationship
COMMENT ON COLUMN part_prices.document_id IS 'Reference to the document (quote) that this price came from';
COMMENT ON COLUMN part_prices.extraction_id IS 'Reference to the extraction that created this price record';
```

4. Click **Run** to execute the migration
5. Verify the columns were added successfully by checking the `part_prices` table structure

### Migration URL
Access your SQL Editor here:
`https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]/sql/new`

## Technical Notes

### Current Price Logic
The system determines the "current" price using this logic:
```typescript
const currentPrice = prices?.find((price) => {
  const validFrom = price.valid_from;
  const validThrough = price.valid_through;
  return (
    validFrom <= now &&
    (validThrough === null || validThrough >= now)
  );
}) || prices?.[0]; // Fall back to most recent if no valid price found
```

### Document URL Retrieval
The part detail page fetches document URLs dynamically when the user clicks "View Document" or "View Quote". This ensures signed URLs are always fresh and valid.

### Responsive Design
The detail page uses a responsive grid layout:
- **Desktop**: 2/3 main content + 1/3 sidebar
- **Mobile**: Full-width stacked layout

## Future Enhancements

Potential improvements that could be added:

1. **Price Charts**: Visualize price trends over time with a line chart
2. **Export History**: Allow users to export price history to CSV/Excel
3. **Price Alerts**: Notify when prices change significantly
4. **Comparative View**: Side-by-side comparison of multiple parts
5. **Bulk Operations**: Select multiple parts to compare or export
6. **Notes/Comments**: Add internal notes about parts or price changes
7. **Approval Workflow**: Require approval for significant price changes
8. **Integration with Orders**: Show which orders have used this part
9. **Inventory Levels**: If inventory tracking is added, display current stock
10. **Alternative Parts**: Suggest compatible or alternative parts

## Testing Recommendations

### Manual Testing Checklist

- [ ] Navigate to `/parts` and verify table displays correctly
- [ ] Click on a part row and verify navigation to detail page
- [ ] Verify all part information displays correctly
- [ ] Check that current price is highlighted
- [ ] Verify price history table shows all historical prices
- [ ] Click "View Document" and verify quote opens
- [ ] Test with parts that have multiple suppliers
- [ ] Test with parts that have no pricing history
- [ ] Verify responsive layout on mobile devices
- [ ] Test back navigation returns to parts list

### Automated Testing

Consider adding tests for:
- API endpoint returns correct structure
- Current price selection logic
- Price history sorting
- Error handling for missing parts
- Document URL generation

## Support and Maintenance

### Common Issues

**Issue**: Part not found
- **Cause**: Invalid part ID in URL
- **Solution**: Verify part exists in database

**Issue**: No prices showing
- **Cause**: Part has no associated prices
- **Solution**: This is normal for newly created parts; prices will appear after quote approval

**Issue**: "View Document" doesn't work
- **Cause**: Document file missing from storage or expired signed URL
- **Solution**: Verify document exists in Supabase Storage

**Issue**: Current price incorrect
- **Cause**: `valid_from` or `valid_through` dates may be incorrect
- **Solution**: Verify date fields in part_prices table

## Files Changed/Created

### New Files
- `app/parts/[id]/page.tsx` - Part detail view page
- `supabase/migrations/20240103000000_add_part_price_source_tracking.sql` - Database migration

### Modified Files
- `lib/types/database.types.ts` - Added new types
- `lib/hooks/use-parts.ts` - Updated return type
- `app/api/parts/[id]/route.ts` - Enhanced with pricing history
- `app/api/extractions/[id]/approve/route.ts` - Updated to track source
- `app/parts/page.tsx` - Made table rows clickable

## Conclusion

This feature provides a complete solution for tracking part details, pricing history, and quote traceability. It maintains the audit trail required for business operations while providing an intuitive interface for users to access historical information and make informed decisions.

The implementation follows Next.js best practices, uses TypeScript for type safety, and maintains consistency with the existing codebase architecture.

