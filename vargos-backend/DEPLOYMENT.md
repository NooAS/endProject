# Vargos Backend - Deployment Guide

## New Features

### 1. Version Tracking System
- **Automatic Snapshots**: Every quote update creates a version snapshot
- **Change History**: View complete history of changes for each quote
- **Version Comparison**: Compare any two versions side-by-side with detailed diff
- **Restore Capability**: Restore any previous version (current state saved first)
- **Change Summaries**: Auto-generated descriptions of what changed

### 2. Performance Optimizations
- **Database Indices**: Added indices on frequently queried fields
- **Response Compression**: Gzip compression for all responses
- **Static File Caching**: Browser caching for static assets in production
- **Rate Limiting**: Protection against abuse (100 req/min per IP)
- **Connection Pooling**: Efficient database connection management

### 3. Security Enhancements
- **Helmet.js**: Security headers protection
- **CORS Configuration**: Configurable allowed origins
- **Cascade Deletes**: Data integrity with proper foreign key constraints
- **Graceful Shutdown**: Proper cleanup on server termination

## Environment Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Configure your environment variables:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/vargos_db"
PORT=4000
NODE_ENV=production
JWT_SECRET=your-secret-key-here
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_MAX=100
```

## Database Migration

Run the migration to add version tracking:
```bash
npm run prisma:migrate
```

Or if deploying:
```bash
npx prisma migrate deploy
```

## Production Deployment

### Prerequisites
- Node.js 18+ 
- PostgreSQL 12+
- PM2 or similar process manager

### Steps

1. Install dependencies:
```bash
npm ci --production
```

2. Generate Prisma Client:
```bash
npm run prisma:generate
```

3. Run migrations:
```bash
npx prisma migrate deploy
```

4. Start the server:
```bash
npm start
```

### Using PM2 (Recommended)

```bash
npm install -g pm2

# Start application
pm2 start npm --name "vargos-backend" -- start

# Enable auto-restart on system boot
pm2 startup
pm2 save

# View logs
pm2 logs vargos-backend

# Monitor
pm2 monit
```

## Docker Deployment

Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .
RUN npx prisma generate

EXPOSE 4000

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t vargos-backend .
docker run -p 4000:4000 --env-file .env vargos-backend
```

## Performance Tuning

### Database Connection Pool
Adjust in your DATABASE_URL:
```
postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20
```

### Rate Limiting
Adjust in `.env`:
```env
RATE_LIMIT_MAX=100          # requests per window
RATE_LIMIT_WINDOW_MS=60000  # window in milliseconds (1 minute)
```

### Static File Caching
Automatically enabled in production mode (NODE_ENV=production).

## API Endpoints

### Version Management

#### Get all versions of a quote
```
GET /quotes/:id/versions
Authorization: Bearer <token>
```

#### Get specific version
```
GET /quotes/:id/versions/:versionNum
Authorization: Bearer <token>
```

#### Compare two versions
```
GET /quotes/:id/compare?v1=1&v2=2
Authorization: Bearer <token>
```

#### Restore a version
```
POST /quotes/:id/versions/:versionNum/restore
Authorization: Bearer <token>
```

## Monitoring

### Health Check
```bash
curl http://localhost:4000/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-11-23T09:00:00.000Z",
  "uptime": 3600,
  "environment": "production"
}
```

## Backup Strategy

1. **Database Backups**: Use pg_dump daily
```bash
pg_dump vargos_db > backup_$(date +%Y%m%d).sql
```

2. **Version History**: Automatically stored in `QuoteVersion` table

## Troubleshooting

### High Memory Usage
- Reduce `DB_POOL_MAX` in connection string
- Check for memory leaks with: `node --inspect`

### Slow Queries
- Check database indices are created
- Run `EXPLAIN ANALYZE` on slow queries
- Consider adding more specific indices

### Rate Limit Issues
- Adjust `RATE_LIMIT_MAX` for your needs
- Consider using Redis for distributed rate limiting

## Security Checklist

- [ ] Change default JWT_SECRET
- [ ] Set strong database password
- [ ] Configure CORS_ORIGIN for your domain
- [ ] Enable HTTPS in production
- [ ] Set NODE_ENV=production
- [ ] Regular security updates: `npm audit fix`
- [ ] Monitor logs for suspicious activity

## Support

For issues or questions, check the repository issues page.
