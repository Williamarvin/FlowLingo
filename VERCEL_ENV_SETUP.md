# Vercel Environment Variable Setup Guide

## IMPORTANT: You need to add this environment variable in Vercel for your app to work!

### Step 1: Get Your Replit Backend URL
Your Replit backend URL is: `https://flowlingo-[YOUR-REPLIT-USERNAME].replit.app`

To find your exact URL:
1. Look at the preview window in Replit
2. Copy the URL from the browser address bar
3. It should look like: `https://flowlingo-username.replit.app`

### Step 2: Add Environment Variable in Vercel

1. Go to your Vercel dashboard
2. Click on your FlowLingo project
3. Go to **Settings** tab
4. Click on **Environment Variables** in the left sidebar
5. Add this variable:
   - **Name**: `VITE_API_URL`
   - **Value**: Your Replit URL (e.g., `https://flowlingo-yourusername.replit.app`)
   - **Environment**: Select all (Production, Preview, Development)
6. Click **Save**

### Step 3: Redeploy Your Application

After adding the environment variable:
1. Go to the **Deployments** tab in Vercel
2. Click on the three dots (...) next to your latest deployment
3. Click **Redeploy**
4. Wait for the deployment to complete

### Step 4: Test Your Application

Once redeployed, your Vercel frontend should now connect to your Replit backend:
- Assessment should load questions
- Conversations should work
- Flashcards should display
- Text generation should function

### Troubleshooting

If features still don't work after setup:
1. Make sure your Replit app is running (the backend server must be active)
2. Verify the URL is correct (no typos, correct username)
3. Check browser console for any CORS errors
4. Ensure the environment variable name is exactly `VITE_API_URL`

### Keep Your Backend Running

Remember: Your Replit backend needs to be running for the Vercel frontend to work. 
The free Replit tier may put your app to sleep after inactivity, so you might need to:
- Keep the Replit tab open
- Or upgrade to a paid Replit plan for always-on hosting