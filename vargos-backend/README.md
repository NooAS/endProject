# Vargos Backend - MySQL Setup

## Overview
This is a Node.js/Express backend application using Prisma ORM with MySQL database.

## Prerequisites
- Node.js (v14 or higher)
- MySQL (v5.7 or higher, or v8.0+)
- npm or yarn

## Database Setup

### 1. Install MySQL
Make sure you have MySQL installed and running on your system.

### 2. Create Database
```sql
CREATE DATABASE vargos_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Configure Environment
Copy `.env.example` to `.env` and update the database connection string:

```bash
cp .env.example .env
```

Edit `.env` and set your MySQL credentials:
```env
DATABASE_URL="mysql://root:your_password@localhost:3306/vargos_db"
PORT=4000
JWT_SECRET=your_jwt_secret_key_here
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Run database migrations:
```bash
npm run prisma:migrate
```

This will create all necessary tables in your MySQL database.

3. (Optional) Generate Prisma Client:
```bash
npm run prisma:generate
```

Note: This happens automatically during `npm install` via postinstall hook.

## Running the Application

### Development Mode
```bash
npm run dev
```

This starts the server with nodemon for auto-restart on file changes.

### Production Mode
```bash
npm start
```

This runs migrations and starts the server.

## API Endpoints

The application provides the following API endpoints:

- `/auth` - Authentication endpoints
- `/categories` - Category management
- `/jobs` - Job management
- `/quotes` - Quote management
- `/health` - Health check endpoint

## Database Models

The application includes the following models:

- **User** - User accounts with authentication
- **Category** - Job categories organized by user
- **Job** - Jobs with pricing and units
- **Quote** - Customer quotes
- **QuoteItem** - Individual items in quotes
- **Template** - Quote templates

## Prisma Commands

- `npm run prisma:migrate` - Create and apply a new migration
- `npm run prisma:generate` - Generate Prisma Client
- `npx prisma studio` - Open Prisma Studio to browse your data

## Migration from PostgreSQL

This project has been migrated from PostgreSQL to MySQL. The main changes:

1. Updated `prisma/schema.prisma` datasource provider to `mysql`
2. Updated `prisma/migrations/migration_lock.toml` to use `mysql`
3. Removed old PostgreSQL migrations
4. All Prisma schema is compatible with MySQL

## Troubleshooting

### Connection Issues
- Verify MySQL is running: `sudo systemctl status mysql`
- Check MySQL credentials in `.env`
- Ensure database exists and user has proper permissions

### Migration Issues
- If migrations fail, ensure database is empty or backup data first
- You can reset the database: `npx prisma migrate reset` (WARNING: This deletes all data)

### Port Already in Use
- Change the PORT in `.env` file
- Or kill the process using port 4000: `sudo lsof -ti:4000 | xargs kill -9`

## Support

For issues or questions, please contact the development team.
