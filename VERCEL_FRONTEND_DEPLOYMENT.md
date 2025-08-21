# Vercel Frontend-Only Deployment Guide

## Architecture
- **Frontend**: Hosted on Vercel (fast, global CDN)
- **Backend API**: Stays on Replit (always running)
- **Database**: Neon PostgreSQL (accessible from both)

## Step 1: Update Frontend to Use Replit Backend

The frontend needs to know where to find your backend API. We'll use an environment variable.

## Step 2: Set Up Vercel

1. **Push current changes to GitHub**:
```bash
git add .
git commit -m "Setup Vercel frontend deployment"
git push $GIT_URL
```

2. **In Vercel Dashboard**:
   - Import your repository
   - Framework Preset: **Vite**
   - Build Command: `vite build`
   - Output Directory: `dist/public`

3. **Add Environment Variables in Vercel**:
   - `VITE_API_URL`: `https://flowlingo-your-username.replit.app`
   - Replace `your-username` with your actual Replit username

## Step 3: Keep Replit Backend Running

Your Replit backend needs to stay online to handle API requests:
1. Keep your Replit project running
2. Consider upgrading to Replit Core for always-on hosting
3. Or use Replit Deployments for the backend

## Benefits of This Approach
✅ Frontend loads super fast from Vercel's CDN
✅ No complex serverless function conversion needed
✅ Backend stays exactly as it is on Replit
✅ Easy to maintain and debug
✅ Can scale frontend and backend independently

## How It Works
1. User visits `flowlingo.vercel.app`
2. Frontend loads from Vercel's CDN
3. Frontend makes API calls to `flowlingo-username.replit.app/api/*`
4. Backend on Replit handles all API logic and database access

## CORS Configuration
Your backend already handles CORS, but you may need to add your Vercel domain to allowed origins.

This is the production-ready approach used by many apps!