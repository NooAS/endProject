# Quick Start Guide for Testing

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 12+ running
- Git installed

## Setup Steps

1. **Clone and navigate:**
```bash
cd vargos-backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment:**
```bash
cp .env.example .env
```

Edit `.env` with your database connection:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/vargos_db"
JWT_SECRET="your-secret-key-here"
PORT=4000
NODE_ENV=development
```

4. **Run database migrations:**
```bash
npm run prisma:migrate
```

5. **Start the server:**
```bash
npm run dev
```

Server should start at `http://localhost:4000`

## Testing the New Features

### 1. Test Version Tracking

1. Open `http://localhost:4000` in your browser
2. Register/Login to the system
3. Create a new quote with some items
4. Save it (versions are created automatically)
5. Edit the quote (add/remove/modify items)
6. Save again
7. Click "Profile" → "История смет"
8. You should see version badges on your quote

### 2. Test Version History

1. In the quote list, click "История версий (X)" button
2. You should see a list of all versions with timestamps
3. Each version shows:
   - Version number
   - Creation date
   - Change summary
   - Total amount

### 3. Test Version Comparison

1. In version history, select two versions from dropdowns
2. Click "Сравнить" button
3. You should see:
   - Summary table with differences
   - Added items (green)
   - Removed items (red)
   - Modified items (yellow)

### 4. Test Version Restore

1. In version history, click "Восстановить" on any version
2. Confirm the action
3. The quote should be restored to that version
4. A new version is created with the restored state

### 5. Test Performance Optimizations

**Rate Limiting:**
```bash
# Try making rapid requests
for i in {1..150}; do
  curl -I http://localhost:4000/health
done
```
After 100 requests, you should see 429 (Too Many Requests)

**Compression:**
```bash
curl -H "Accept-Encoding: gzip" -I http://localhost:4000/
```
Should see `Content-Encoding: gzip` header

**Health Check:**
```bash
curl http://localhost:4000/health
```
Should return:
```json
{
  "status": "ok",
  "timestamp": "...",
  "uptime": 123,
  "environment": "development"
}
```

## API Testing with curl

### Get Quotes
```bash
TOKEN="your-jwt-token-here"
curl -H "Authorization: Bearer $TOKEN" http://localhost:4000/quotes/my
```

### Get Version History
```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:4000/quotes/1/versions
```

### Compare Versions
```bash
curl -H "Authorization: Bearer $TOKEN" "http://localhost:4000/quotes/1/compare?v1=1&v2=2"
```

### Restore Version
```bash
curl -X POST -H "Authorization: Bearer $TOKEN" http://localhost:4000/quotes/1/versions/1/restore
```

## Verification Checklist

- [ ] Server starts without errors
- [ ] Can register/login
- [ ] Can create and edit quotes
- [ ] Versions are created automatically
- [ ] Version history shows all versions
- [ ] Version comparison works
- [ ] Version restore works
- [ ] Rate limiting activates after 100 requests
- [ ] Responses are compressed
- [ ] Health check endpoint works

## Troubleshooting

**Database connection error:**
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Try: `psql -h localhost -U username -d vargos_db`

**Migration errors:**
- Delete and recreate database
- Run `npx prisma migrate reset`
- Run `npm run prisma:migrate` again

**Port already in use:**
- Change PORT in .env
- Or stop other process: `lsof -ti:4000 | xargs kill`

**Version comparison shows nothing:**
- Make sure to edit the quote between versions
- Check browser console for errors
- Verify API returns data: `curl -H "Authorization: Bearer $TOKEN" http://localhost:4000/quotes/1/compare?v1=1&v2=2`

## Performance Testing

**Simple load test:**
```bash
# Install Apache Bench
apt-get install apache2-utils

# Test 1000 requests, 10 concurrent
ab -n 1000 -c 10 http://localhost:4000/health
```

**Monitor memory:**
```bash
# While server is running
ps aux | grep node
```

**Check database performance:**
```sql
-- Connect to database
psql -d vargos_db

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check indices
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_indexes
WHERE schemaname NOT IN ('pg_catalog', 'information_schema');
```

## Development Tips

**Watch logs:**
```bash
# Server logs in terminal
npm run dev

# Or use PM2
pm2 logs vargos-backend
```

**Inspect database:**
```bash
npx prisma studio
# Opens at http://localhost:5555
```

**Check for updates:**
```bash
npm outdated
npm audit
```

## Next Steps

After successful testing:
1. Review all features work as expected
2. Check browser console for any errors
3. Verify database migrations applied correctly
4. Test on different browsers
5. Prepare for production deployment

For production deployment, see [DEPLOYMENT.md](DEPLOYMENT.md)
