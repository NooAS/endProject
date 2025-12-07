# 📦 Export/Import Categories Feature - Quick Reference

## 🎯 What This Feature Does

Allows users to **export** their categories and templates to a JSON file and **import** them back later.

## 🚀 Quick Start

### Export Categories
1. Open Categories Modal: Click **"Zarządzaj kategoriami"**
2. Click **"⬇️ Eksportuj"** button
3. File automatically downloads: `categories-export-{timestamp}.json`

### Import Categories
1. Open Categories Modal: Click **"Zarządzaj kategoriami"**
2. Click **"⬆️ Importuj"** button
3. Select your JSON file
4. Choose mode:
   - **Połącz z istniejącymi** (Merge) - Safe, keeps existing
   - **Zastąp wszystkie** (Replace) - Deletes all, imports fresh
5. Click **"Importuj"**
6. Done! ✅

## 📁 File Format

```json
{
  "version": "1.0",
  "exportDate": "2025-12-07T19:30:00.000Z",
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

## 🎨 UI Elements

### Categories Modal

```
┌─────────────────────────────────────────┐
│  Kategorie i Szablony              ✕   │
├─────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐     │
│  │⬇️ Eksportuj │  │⬆️ Importuj  │     │
│  └─────────────┘  └─────────────┘     │
│                                         │
│  [Your categories appear here...]      │
└─────────────────────────────────────────┘
```

### Import Modal

```
┌─────────────────────────────────────────┐
│  Tryb importu kategorii            ✕   │
├─────────────────────────────────────────┤
│  ◉ Połącz z istniejącymi               │
│     Adds new, keeps existing            │
│                                         │
│  ○ Zastąp wszystkie                    │
│     ⚠️ Deletes all, imports fresh      │
│                                         │
│  ┌───────────┐  ┌───────────┐         │
│  │ Importuj  │  │  Anuluj   │         │
│  └───────────┘  └───────────┘         │
└─────────────────────────────────────────┘
```

## ✨ Features

✅ One-click export  
✅ Two import modes (merge/replace)  
✅ Duplicate detection  
✅ Error handling  
✅ Authentication required  
✅ User data isolation  
✅ Professional UI  

## 🔒 Security

- ✅ JWT authentication required
- ✅ Users can only access their own data
- ✅ Input validation on all fields
- ✅ SQL injection prevention via Prisma
- ✅ Error messages don't expose sensitive data

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **EXPORT_IMPORT_FEATURE.md** | Complete feature documentation |
| **SECURITY_SUMMARY_EXPORT_IMPORT.md** | Security analysis and findings |
| **TEST_PLAN_EXPORT_IMPORT.md** | 40+ test scenarios |
| **UI_PREVIEW_EXPORT_IMPORT.md** | UI mockups and flow diagrams |
| **IMPLEMENTATION_SUMMARY_EXPORT_IMPORT.md** | Technical implementation details |

## 🛠️ Technical Details

### Backend Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/categories/export` | GET | Download categories as JSON |
| `/categories/import` | POST | Upload and import categories |

### Modified Files

**Backend:**
- `src/routes/categoryRoutes.js`

**Frontend:**
- `public/js/categories-api.js`
- `public/js/main.js`
- `public/js/modals.js`
- `public/index.html`

## 🧪 Testing

Run through the test plan in `TEST_PLAN_EXPORT_IMPORT.md`:
- Export with data / without data
- Import merge mode
- Import replace mode
- Error handling
- UI validation

## ❗ Known Issues

**Rate Limiting**: The export/import endpoints (like all endpoints in the app) don't have rate limiting. This is a pre-existing app-wide issue, not specific to this feature. See `SECURITY_SUMMARY_EXPORT_IMPORT.md` for details.

## 🎓 Use Cases

1. **Backup**: Export before making major changes
2. **Migration**: Transfer categories to new account
3. **Sharing**: Share template sets with team
4. **Testing**: Quickly populate test environments
5. **Recovery**: Restore after accidental deletion

## 💡 Tips

- **Always use merge mode** unless you want to completely replace everything
- **Merge mode is the default** for safety
- **Export before importing** to have a backup
- **Check the JSON structure** if you manually create files
- **File must be .json format** - other formats won't work

## 🐛 Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| "Nieprawidłowy format pliku JSON" | Invalid JSON | Check JSON syntax |
| "Nieprawidłowy format pliku - brak tablicy kategorii" | Missing categories field | Add `categories` array |
| No download | Network error | Check connection |
| Import does nothing | Cancelled modal | Try again, click "Importuj" |

## 📞 Support

For issues or questions, refer to:
1. `EXPORT_IMPORT_FEATURE.md` - Feature guide
2. `TEST_PLAN_EXPORT_IMPORT.md` - Testing scenarios
3. `IMPLEMENTATION_SUMMARY_EXPORT_IMPORT.md` - Technical details

---

**Status**: ✅ Complete and ready for production  
**Version**: 1.0  
**Last Updated**: 2025-12-07
