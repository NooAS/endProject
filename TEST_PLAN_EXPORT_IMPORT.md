# Test Plan - Export/Import Categories Feature

## Overview
This document outlines the test scenarios for the export/import functionality of categories and templates.

## Prerequisites
- User must be logged in to access the feature
- Access to the categories management modal

## Test Scenarios

### 1. Export Functionality

#### Test 1.1: Export with Multiple Categories
**Steps:**
1. Log in to the application
2. Create at least 2-3 categories with different names
3. Add 2-3 templates to each category with default prices
4. Click "Zarządzaj kategoriami" (Manage Categories)
5. Click "⬇️ Eksportuj" button

**Expected Result:**
- JSON file downloads automatically
- Filename format: `categories-export-{timestamp}.json`
- File contains valid JSON with structure:
  ```json
  {
    "version": "1.0",
    "exportDate": "ISO timestamp",
    "categories": [...]
  }
  ```

#### Test 1.2: Export with Empty Categories
**Steps:**
1. Create a category without any templates
2. Export categories

**Expected Result:**
- Export succeeds
- Category appears in export with empty `templates` array

#### Test 1.3: Export with No Categories
**Steps:**
1. Delete all categories
2. Try to export

**Expected Result:**
- Export succeeds
- JSON contains empty `categories` array

### 2. Import Functionality - Merge Mode

#### Test 2.1: Import New Categories (Merge)
**Steps:**
1. Create 1-2 categories with templates
2. Export to save current state
3. Create a new export file with different category names
4. Import the new file
5. Select "Połącz z istniejącymi" (Merge)
6. Click "Importuj"

**Expected Result:**
- Success message: "Import zakończony pomyślnie!"
- Both old and new categories visible
- Total categories = original + new

#### Test 2.2: Import Duplicate Categories (Merge)
**Steps:**
1. Export current categories
2. Import the same file
3. Select "Połącz z istniejącymi" (Merge)

**Expected Result:**
- Import succeeds
- No duplicates created
- Original categories remain unchanged

#### Test 2.3: Import with Partial Duplicates (Merge)
**Steps:**
1. Create categories: "Cat1", "Cat2"
2. Create new JSON with: "Cat2", "Cat3"
3. Import with merge mode

**Expected Result:**
- "Cat1" remains (not affected)
- "Cat2" not duplicated (skipped)
- "Cat3" added as new

### 3. Import Functionality - Replace Mode

#### Test 3.1: Import with Replace
**Steps:**
1. Create 2-3 categories with templates
2. Export to a file
3. Manually edit the file to have completely different categories
4. Import the edited file
5. Select "Zastąp wszystkie" (Replace)
6. Click "Importuj"

**Expected Result:**
- Warning shown in modal about deletion
- After import, only categories from file exist
- All original categories deleted
- All original templates deleted

#### Test 3.2: Replace with Empty Import
**Steps:**
1. Create several categories
2. Create JSON file with empty categories array
3. Import with replace mode

**Expected Result:**
- All categories deleted
- Categories list shows "Brak kategorii" message

### 4. Error Handling

#### Test 4.1: Invalid JSON File
**Steps:**
1. Create a text file with invalid JSON (e.g., `{invalid}`)
2. Rename to .json
3. Try to import

**Expected Result:**
- Error message: "Nieprawidłowy format pliku JSON"
- No changes to categories
- File input resets

#### Test 4.2: Missing Required Fields
**Steps:**
1. Create JSON without `categories` field
2. Try to import

**Expected Result:**
- Error message: "Nieprawidłowy format pliku - brak tablicy kategorii"
- No changes to categories

#### Test 4.3: Wrong File Type
**Steps:**
1. Try to select a .txt or .csv file

**Expected Result:**
- File picker only shows .json files
- Cannot select other types

#### Test 4.4: Cancel Import
**Steps:**
1. Click "⬆️ Importuj"
2. Select a valid JSON file
3. Click "Anuluj" in the confirmation modal

**Expected Result:**
- Import cancelled
- No changes made
- File input resets
- No error messages

### 5. UI/UX Tests

#### Test 5.1: Modal Display
**Steps:**
1. Open import confirmation modal
2. Review content

**Expected Result:**
- Clear explanation of both modes
- Merge mode selected by default
- Replace mode clearly marked as destructive (red text, warning icon)
- Both buttons visible and accessible

#### Test 5.2: Button Icons
**Steps:**
1. Open categories modal
2. Check export/import buttons

**Expected Result:**
- Export button shows ⬇️ icon
- Import button shows ⬆️ icon
- Tooltips show correct descriptions

#### Test 5.3: Success Feedback
**Steps:**
1. Successfully import categories

**Expected Result:**
- Alert shows: "Import zakończony pomyślnie!"
- Categories modal refreshes
- New categories visible immediately

### 6. Data Integrity Tests

#### Test 6.1: Template Defaults Preserved
**Steps:**
1. Create templates with specific default prices (e.g., 25.5, 10.75, 15.25)
2. Export
3. Delete original categories
4. Import

**Expected Result:**
- All price values match exactly (including decimals)
- clientPrice, materialPrice, laborPrice all preserved

#### Test 6.2: Category Order Preserved
**Steps:**
1. Create categories with specific order values
2. Export and import

**Expected Result:**
- Categories appear in same order
- Order field values preserved

#### Test 6.3: Special Characters in Names
**Steps:**
1. Create categories/templates with special characters:
   - Polish characters: ąćęłńóśźż
   - Symbols: &, @, #
   - Quotes: "test", 'test'
2. Export and import

**Expected Result:**
- All names preserved exactly
- No encoding issues
- No data corruption

### 7. Authentication Tests

#### Test 7.1: Export Without Auth
**Steps:**
1. Log out
2. Try to access /categories/export endpoint directly

**Expected Result:**
- 401 Unauthorized error
- No data returned

#### Test 7.2: Import Without Auth
**Steps:**
1. Log out
2. Try to POST to /categories/import

**Expected Result:**
- 401 Unauthorized error
- No data modified

## Manual Testing Checklist

- [ ] Export with multiple categories and templates
- [ ] Export with no categories
- [ ] Import with merge mode (new categories)
- [ ] Import with merge mode (duplicates)
- [ ] Import with replace mode
- [ ] Import invalid JSON file
- [ ] Import file with missing fields
- [ ] Cancel import operation
- [ ] Verify modal UI and messaging
- [ ] Check button icons and tooltips
- [ ] Verify data integrity (prices, order, names)
- [ ] Test with special characters
- [ ] Verify success messages

## Performance Considerations

### Large Dataset Test
**Steps:**
1. Create 50+ categories with 10+ templates each
2. Export
3. Import

**Expected Result:**
- Export completes in < 5 seconds
- Import completes in < 30 seconds
- UI remains responsive
- No browser hang or crash

## Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

## Notes

- All tests should be performed with browser developer console open to catch any JavaScript errors
- Check network tab to verify API requests/responses
- Document any unexpected behavior or edge cases discovered
