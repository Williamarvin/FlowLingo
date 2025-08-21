# FlowLingo Environment Setup Guide

## Current Status ✅
Your environment variables are already configured in Replit's secure Secrets system. No additional setup needed for deployment on Replit.

## Required Environment Variables

The following environment variables are needed for FlowLingo to function:

### 1. Database Configuration (PostgreSQL)
- `DATABASE_URL` - Full PostgreSQL connection string
- `PGDATABASE` - Database name
- `PGHOST` - Database host URL
- `PGPASSWORD` - Database password
- `PGPORT` - Database port (usually 5432)
- `PGUSER` - Database username

### 2. API Keys
- `OPENAI_API_KEY` - Your OpenAI API key for AI features

### 3. Object Storage (Replit)
- `PUBLIC_OBJECT_SEARCH_PATHS` - Path to public object storage
- `PRIVATE_OBJECT_DIR` - Path to private object storage

## Accessing Your Current Configuration

### In Replit
1. Click the 🔒 **Secrets** button in the left sidebar
2. View all configured environment variables
3. These are automatically loaded when your app runs

### For Local Development
If you want to run this locally:

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in your credentials in the `.env` file

3. **IMPORTANT**: Never commit `.env` to git! It's already in `.gitignore`

## Getting Your Own Credentials

### OpenAI API Key
1. Visit https://platform.openai.com/api-keys
2. Create a new API key
3. Copy and save it securely

### PostgreSQL Database
**Option 1: Neon (Recommended)**
1. Visit https://neon.tech
2. Create a free account
3. Create a new project
4. Copy the connection string

**Option 2: Supabase**
1. Visit https://supabase.com
2. Create a new project
3. Go to Settings → Database
4. Copy connection details

**Option 3: Local PostgreSQL**
1. Install PostgreSQL locally
2. Create a database: `createdb flowlingo`
3. Use local connection string: `postgresql://localhost/flowlingo`

## Security Best Practices

1. **Never share your API keys publicly**
2. **Never commit secrets to Git**
3. **Use different API keys for development and production**
4. **Rotate keys regularly**
5. **Set spending limits on OpenAI**

## Deployment Environments

### Replit Deployment
- Secrets are automatically available
- No additional configuration needed
- Use the Deploy button in Replit

### Vercel/Netlify
- Add environment variables in dashboard
- Use their secrets management UI

### Docker/Self-hosted
- Use Docker secrets or environment files
- Pass variables at runtime: `docker run --env-file .env`

## Checking Your Configuration

Run this command to verify all required variables are set:

```bash
node -e "
const required = [
  'DATABASE_URL',
  'OPENAI_API_KEY',
  'PGHOST',
  'PGUSER',
  'PGPASSWORD',
  'PGDATABASE'
];
const missing = required.filter(key => !process.env[key]);
if (missing.length) {
  console.log('❌ Missing:', missing.join(', '));
} else {
  console.log('✅ All required environment variables are set!');
}
"
```

## Troubleshooting

### Database Connection Issues
- Check if DATABASE_URL includes `?sslmode=require` for cloud databases
- Verify firewall allows connections from your IP
- Test connection: `psql $DATABASE_URL`

### OpenAI API Issues
- Verify API key starts with `sk-`
- Check API key has sufficient credits
- Test with: `curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"`

### Object Storage Issues
- Ensure bucket exists in Replit
- Check paths match your bucket ID
- Verify permissions are set correctly

---

**Note**: Your current Replit environment has all variables configured and working. This guide is for reference and for setting up FlowLingo in other environments.