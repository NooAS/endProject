# Testing Guide - Version Tracking and Charts

## Overview
This guide describes how to test the new features:
1. Quote versioning with same names
2. Version viewing and management
3. Expense pie chart
4. Profit line chart by categories

## Prerequisites
- PostgreSQL database running
- Backend server running on port 4000 (or configured port)
- User account created and logged in

## Test Scenarios

### 1. Quote Versioning

#### Test 1.1: Create First Version
1. Log in to the application
2. Create a new quote with name "Test Project"
3. Add some items with categories
4. Click "Zapisz do historii" (Save to history)
5. **Expected**: Quote is saved with version 1

#### Test 1.2: Create Second Version with Same Name
1. Clear the current quote or reload the page
2. Create another quote with the SAME name "Test Project"
3. Add different items or change amounts
4. Click "Zapisz do historii"
5. **Expected**: New version (v2) is created, not updating the existing one

#### Test 1.3: Verify Version Display in History
1. Click "Profil" → "Historia kosztorysów"
2. Find "Test Project" in the list
3. **Expected**: 
   - Only ONE entry for "Test Project" is shown
   - A blue badge shows "2 wersji" next to the name
   - The displayed totals are from the latest version

#### Test 1.4: View All Versions
1. In Historia kosztorysów, find "Test Project"
2. Click "Zobacz wersje" button (purple button)
3. **Expected**:
   - Modal opens with title "Wersje: Test Project"
   - Lists all versions (v1, v2)
   - Latest version has "Najnowsza" green badge
   - Each version shows:
     - Version number
     - Creation date
     - Update date
     - Total amount
     - "Edytuj tę wersję" button
     - "Usuń" button

#### Test 1.5: Edit Specific Version
1. In the versions modal, click "Edytuj tę wersję" on version 1
2. **Expected**: 
   - Modal closes
   - Quote is loaded into the editor
   - All items from version 1 are displayed

#### Test 1.6: Create Multiple Versions
1. Create 5+ versions of "Test Project" with different amounts
2. Check historia kosztorysów
3. **Expected**: Badge shows "5 wersji" (or more)

### 2. Charts and Statistics

#### Test 2.1: Open Charts Modal
1. Click "Profil" → "Wykresy i statystyki"
2. **Expected**:
   - Large modal opens
   - Two chart sections are visible:
     - "Diagram kosztów według kategorii" (Pie chart)
     - "Wykres zysku według kategorii" (Bar chart)

#### Test 2.2: Verify Pie Chart
1. Look at the pie chart
2. **Expected**:
   - Shows expense distribution by categories
   - Different colors for each category
   - Legend at bottom shows category names
   - Hovering shows: category name, amount, percentage
   - Categories without data are not shown

#### Test 2.3: Verify Profit Bar Chart
1. Look at the bar chart
2. **Expected**:
   - Shows profit for each category
   - Green bars for positive profit
   - Red bars for negative profit (losses)
   - Y-axis shows "Zysk (zł)"
   - Hovering shows exact profit amount

#### Test 2.4: Test with Extended Mode Data
1. Create quotes in "Extended Mode" with:
   - Material prices (Mat.)
   - Labor prices (Rob.)
2. Open charts
3. **Expected**:
   - Profit is calculated as: (Client Price × Quantity) - (Material Price × Quantity) - (Labor Price × Quantity)
   - Bars correctly show green for profit, red for loss

### 3. API Endpoints Testing

#### Test 3.1: Get My Quotes with Version Count
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/quotes/my
```
**Expected Response**:
```json
[
  {
    "id": 1,
    "name": "Test Project",
    "total": 1500.00,
    "version": 2,
    "versionCount": 2,
    "createdAt": "2024-12-07T...",
    "updatedAt": "2024-12-07T...",
    ...
  }
]
```

#### Test 3.2: Get Quote Versions by Name
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:4000/quotes/versions/Test%20Project"
```
**Expected Response**:
```json
[
  {
    "id": 2,
    "name": "Test Project",
    "version": 2,
    "total": 1500.00,
    "createdAt": "2024-12-07T...",
    "items": [...]
  },
  {
    "id": 1,
    "name": "Test Project",
    "version": 1,
    "total": 1200.00,
    "createdAt": "2024-12-07T...",
    "items": [...]
  }
]
```

### 4. Edge Cases

#### Test 4.1: Single Version
1. Create a quote "Single Version Project"
2. Save to history
3. Check historia kosztorysów
4. **Expected**: 
   - No version count badge shown
   - No "Zobacz wersje" button

#### Test 4.2: Empty Category Data
1. Create quotes without categories or with all items in "Bez kategorii"
2. Open charts
3. **Expected**:
   - Charts still display
   - "Bez kategorii" appears as a category

#### Test 4.3: Delete Version
1. Open versions modal
2. Click "Usuń" on an older version
3. Confirm deletion
4. **Expected**:
   - Version is deleted
   - Version count decreases
   - If only 1 version remains, badge disappears

#### Test 4.4: No Quotes
1. With no saved quotes, open charts
2. **Expected**:
   - Modal opens
   - Charts show empty state or "No data"

### 5. UI/UX Testing

#### Test 5.1: Responsive Design - Mobile
1. Resize browser to mobile width (<768px)
2. Check historia kosztorysów
3. **Expected**:
   - Version badge displays correctly
   - "Zobacz wersje" button is accessible
   - Charts modal is scrollable

#### Test 5.2: Version Badge Color
1. Check version badge color
2. **Expected**: Blue background (#3b82f6), white text

#### Test 5.3: Charts Modal Size
1. Open charts modal
2. **Expected**: Wider than normal modals (max-width: 1000px)

### 6. Performance Testing

#### Test 6.1: Many Versions
1. Create 20+ versions of same quote
2. Click "Zobacz wersje"
3. **Expected**: 
   - Modal loads quickly (<1 second)
   - All versions listed
   - Scrollable if needed

#### Test 6.2: Large Dataset Charts
1. Create 50+ quotes with various categories
2. Open charts modal
3. **Expected**:
   - Charts render within 2 seconds
   - All data points visible
   - Interactive hover still works

## Database Verification

### Verify Schema Changes
```sql
-- Check Quote table structure
\d "Quote"

-- Should show new columns:
-- - updatedAt (timestamp)
-- - version (integer, default 1)
-- - parentQuoteId (integer, nullable)

-- Check index exists
SELECT * FROM pg_indexes 
WHERE tablename = 'Quote' 
  AND indexname = 'Quote_userId_name_createdAt_idx';
```

### Verify Version Data
```sql
-- Get all versions of a quote
SELECT id, name, version, total, "createdAt", "updatedAt"
FROM "Quote"
WHERE name = 'Test Project'
ORDER BY version DESC;

-- Count versions per quote name
SELECT name, COUNT(*) as version_count
FROM "Quote"
GROUP BY name
HAVING COUNT(*) > 1;
```

## Known Issues and Limitations

1. **Version grouping**: Quotes are grouped by exact name match (case-sensitive)
2. **Chart performance**: Very large datasets (1000+ quotes) may slow down chart rendering
3. **Category names**: Charts use category ID as string, may need mapping to category names
4. **Deleted versions**: Deleting a version doesn't renumber remaining versions

## Success Criteria

✅ All test scenarios pass
✅ No console errors
✅ Charts display correctly
✅ Version badges appear when multiple versions exist
✅ API endpoints return expected data
✅ Database schema updated correctly
✅ Mobile responsive
✅ Performance acceptable (<2s for chart loading)
