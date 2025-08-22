# Database Migration Guide: Neon to Railway

## Overview
This guide walks through migrating your FlowLingo database from Neon PostgreSQL to Railway PostgreSQL.

## Prerequisites
- [x] Current Neon database backed up
- [ ] Railway database created  
- [ ] Public Railway DATABASE_URL obtained

## Migration Steps

### 1. Backup Current Data (COMPLETED)
```bash
# Data only backup
pg_dump "$DATABASE_URL" --data-only --no-owner --no-privileges --disable-triggers > neon_data_backup.sql

# Full backup with schema
pg_dump "$DATABASE_URL" --no-owner --no-privileges > neon_full_backup.sql
```
✅ Backups created: 219KB total

### 2. Update Environment Variables
You need the PUBLIC Railway URL, not the internal one:
- ❌ Wrong: `postgres.railway.internal` (only works inside Railway)
- ✅ Right: `[something].railway.app` (works from anywhere)

### 3. Push Schema to Railway
```bash
# Set Railway DATABASE_URL
export DATABASE_URL="your-railway-public-url-here"

# Push schema using Drizzle
npm run db:push
```

### 4. Import Data to Railway
```bash
# Import data to Railway
psql "$DATABASE_URL" < neon_data_backup.sql
```

### 5. Verify Migration
- Check that all tables exist
- Verify data was imported correctly
- Test application functionality

## Rollback Plan
If something goes wrong:
1. Keep using original Neon database (don't delete it yet!)
2. Restore from `neon_full_backup.sql` if needed

## Post-Migration
After confirming everything works:
1. Update production environment variables
2. Test thoroughly
3. Only then consider removing Neon database