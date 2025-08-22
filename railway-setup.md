# Railway Setup Guide for FlowLingo

## Required Environment Variables

Make sure these are set in your Railway deployment:

1. **DATABASE_URL** - Already set (from PostgreSQL addon)
2. **JWT_SECRET** - ⚠️ MISSING - Add this immediately!
3. **OPENAI_API_KEY** - Already set
4. **NODE_ENV** - Set to "production"

## Add Missing Environment Variables

In Railway dashboard:

1. Go to your FlowLingo service
2. Click on "Variables" tab
3. Add these variables:

```
JWT_SECRET=your-secret-key-here-make-it-long-and-random
NODE_ENV=production
```

## Database Migration

After adding environment variables, you need to migrate the database schema.

### Option 1: Run Migration Command in Railway

In Railway dashboard:
1. Go to your FlowLingo service
2. Click on "Settings" tab
3. Under "Deploy" section, add this to "Start Command":
   ```
   npm run db:push && npm run dev
   ```

### Option 2: Manual Migration

If Option 1 doesn't work, you can manually run the migration:

1. Install Railway CLI: https://docs.railway.app/develop/cli
2. Link to your project: `railway link`
3. Run migration: `railway run npm run db:push`

## Verify Setup

After completing the setup:

1. Visit https://flowlingo-production.up.railway.app
2. Try creating a new account
3. If it works, remove the migration command from Start Command and keep only: `npm run dev`

## Troubleshooting

If signup still fails:

1. Check Railway logs for specific error messages
2. Verify all environment variables are set
3. Ensure database is running (check PostgreSQL service status)
4. Try redeploying the service after changes