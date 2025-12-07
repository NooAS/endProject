# Export/Import Categories and Templates Feature

## Overview
This feature allows users to export their categories and templates to a JSON file and import them back later. This is useful for:
- Backing up your category structure
- Sharing category templates with other users
- Transferring categories between different installations
- Quickly setting up new accounts with predefined categories

## How to Use

### Exporting Categories
1. Click on "Zarządzaj kategoriami" (Manage Categories) button in the sidebar
2. In the categories modal, click the "📥 Eksportuj" (Export) button at the top
3. A JSON file will be automatically downloaded with your categories and templates
4. The file name will be in the format: `categories-export-{timestamp}.json`

### Importing Categories
1. Click on "Zarządzaj kategoriami" (Manage Categories) button in the sidebar
2. In the categories modal, click the "📤 Importuj" (Import) button at the top
3. Select a JSON file with the correct format (previously exported file)
4. Choose whether to:
   - **Replace existing** - Removes all current categories and replaces them with imported ones
   - **Merge** - Adds new categories while keeping existing ones (duplicates are skipped)
5. Click OK to complete the import

## JSON File Format

The exported file has the following structure:

```json
{
  "version": "1.0",
  "exportDate": "2025-12-07T19:00:00.000Z",
  "categories": [
    {
      "name": "Category Name",
      "order": 1,
      "templates": [
        {
          "name": "Template Name",
          "defaults": {
            "clientPrice": 25.5,
            "materialPrice": 8,
            "laborPrice": 12
          }
        }
      ]
    }
  ]
}
```

### Field Descriptions:
- `version`: Format version (currently "1.0")
- `exportDate`: ISO timestamp of when the export was created
- `categories`: Array of category objects
  - `name`: Category name (required)
  - `order`: Display order (optional, defaults to 0)
  - `templates`: Array of template objects
    - `name`: Template name (required)
    - `defaults`: Optional default prices
      - `clientPrice`: Price for client
      - `materialPrice`: Material cost
      - `laborPrice`: Labor cost

## Technical Implementation

### Backend Endpoints

#### GET /categories/export
- **Authentication**: Required (Bearer token)
- **Response**: JSON file download with categories and templates
- **Status Codes**:
  - 200: Success - returns JSON file
  - 401: Unauthorized - no valid token
  - 500: Server error

#### POST /categories/import
- **Authentication**: Required (Bearer token)
- **Request Body**:
  ```json
  {
    "categories": [...],
    "replaceExisting": true/false
  }
  ```
- **Response**: Success/error message
- **Status Codes**:
  - 200: Success - import completed
  - 400: Bad request - invalid data format
  - 401: Unauthorized - no valid token
  - 500: Server error

### Frontend Implementation

The feature is implemented in:
- `public/js/categories-api.js`: API functions for export/import
- `public/js/main.js`: UI integration in the categories modal

## Error Handling

The feature handles various error scenarios:
1. **Invalid JSON format**: Shows error message
2. **Missing required fields**: Skips invalid categories/templates
3. **Network errors**: Shows user-friendly error message
4. **Duplicate names**: 
   - In merge mode: Skips duplicates
   - In replace mode: Creates new entries

## Security Considerations

- All operations require user authentication
- Users can only export/import their own categories
- File validation prevents malformed data from corrupting the database
- SQL injection protection through Prisma ORM parameterized queries
