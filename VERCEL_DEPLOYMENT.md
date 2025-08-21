# Vercel Deployment Guide for FlowLingo

## Prerequisites
✅ GitHub repository connected (done!)
✅ Vercel account (free at vercel.com)
✅ PostgreSQL database (Neon, Supabase, or any PostgreSQL provider)
✅ OpenAI API key

## Step 1: Connect GitHub to Vercel

1. **Go to [vercel.com](https://vercel.com)** and sign up/login
2. Click **"Add New Project"**
3. **Import Git Repository**
   - Connect your GitHub account if not already connected
   - Select `Williamarvin/FlowLingo` repository
4. Click **"Import"**

## Step 2: Configure Build Settings

Vercel should auto-detect these settings, but verify:

- **Framework Preset:** Vite
- **Root Directory:** `.` (leave empty or put a dot)
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

## Step 3: Set Environment Variables (CRITICAL!)

In the Vercel deployment page, you'll see **"Environment Variables"** section. Add these:

### Required Variables:

| Key | Value | Description |
|-----|-------|-------------|
| `DATABASE_URL` | `postgresql://user:pass@host/db?sslmode=require` | Your PostgreSQL connection string |
| `PGDATABASE` | `your_database_name` | Database name |
| `PGHOST` | `your.database.host.com` | Database host |
| `PGPASSWORD` | `your_database_password` | Database password |
| `PGPORT` | `5432` | Database port (usually 5432) |
| `PGUSER` | `your_database_user` | Database username |
| `OPENAI_API_KEY` | `sk-...` | Your OpenAI API key |

### Optional Variables:

| Key | Value | Description |
|-----|-------|-------------|
| `SESSION_SECRET` | `random-32-char-string` | Session encryption key |
| `NODE_ENV` | `production` | Environment mode |

## Step 4: Database Setup

### Option A: Use Neon (Recommended for Vercel)
1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Use it as your `DATABASE_URL`

### Option B: Use Supabase
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string
5. Use it as your `DATABASE_URL`

### Option C: Use Your Existing Database
If you already have a PostgreSQL database, just use its connection string.

## Step 5: Deploy

1. After adding all environment variables, click **"Deploy"**
2. Vercel will:
   - Clone your repository
   - Install dependencies
   - Build the project
   - Deploy to their edge network
3. Wait 2-3 minutes for deployment

## Step 6: Database Migration

After first deployment, you need to set up the database schema:

1. Go to your Vercel project dashboard
2. Go to **Settings** → **Functions**
3. Or use a database client to run the schema from `shared/schema.ts`

## Step 7: Access Your App

Once deployed, you'll get:
- **Production URL:** `flowlingo.vercel.app` (or custom)
- **Preview URLs:** For each git branch

## Troubleshooting

### Common Issues:

1. **"Database connection failed"**
   - Check DATABASE_URL has `?sslmode=require` at the end
   - Verify all PG* environment variables are set

2. **"OpenAI API error"**
   - Verify OPENAI_API_KEY is correct
   - Check OpenAI account has credits

3. **"Build failed"**
   - Check build logs in Vercel dashboard
   - Ensure all dependencies are in package.json

4. **"404 on API routes"**
   - The vercel.json file handles routing
   - Make sure it's committed to GitHub

### Environment Variables Quick Copy

Here's a template to copy and fill in Vercel:

```
DATABASE_URL=postgresql://username:password@host.com/database?sslmode=require
PGDATABASE=your_db_name
PGHOST=your.host.com
PGPASSWORD=your_password
PGPORT=5432
PGUSER=your_username
OPENAI_API_KEY=sk-your-key-here
SESSION_SECRET=generate-random-32-characters-here
NODE_ENV=production
```

## Updating Your App

After deployment, any push to your GitHub main branch will:
1. Automatically trigger a new deployment
2. Update your live app within minutes

## Custom Domain (Optional)

1. Go to your Vercel project
2. Go to **Settings** → **Domains**
3. Add your custom domain
4. Follow DNS configuration instructions

## Important Notes

- ⚠️ **Never commit .env files** to GitHub
- ✅ **Always use environment variables** in Vercel dashboard
- 🔒 **Keep your API keys secret**
- 📊 **Monitor usage** to avoid unexpected costs

## Support

- **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)
- **Database Issues:** Check your database provider's docs
- **OpenAI Issues:** Check [platform.openai.com](https://platform.openai.com)

---

**Ready to deploy!** Follow these steps and your FlowLingo app will be live in minutes! 🚀