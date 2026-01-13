# Quick Setup Guide

Follow these steps to get your challenge platform running:

## Step 1: Set Up Supabase Database with Prisma

1. Go to https://supabase.com and create a new project (or use existing)
2. Wait for the project to be ready (takes ~2 minutes)
3. Go to **Project Settings** > **Database**
4. Click on the **"ORMs"** tab (not "Connection String")
5. Select **"Prisma"** from the dropdown
6. You'll see two connection strings:

   **DATABASE_URL** (Connection Pooling - for your app):
   - This uses port **6543** with `?pgbouncer=true`
   - Optimized for serverless/server apps
   - Copy this entire string (it will have `[YOUR-PASSWORD]` placeholder)
   - Replace `[YOUR-PASSWORD]` with your actual database password

   **DIRECT_URL** (Direct Connection - for migrations):
   - This uses port **5432** (direct connection)
   - Only used by Prisma for migrations
   - Copy this entire string (it will have `[YOUR-PASSWORD]` placeholder)
   - Replace `[YOUR-PASSWORD]` with your actual database password

7. **Important:** Make sure to replace `[YOUR-PASSWORD]` in BOTH strings with your actual Supabase database password

## Step 2: Create Environment Variables File

1. Create a new file named `.env` in the root directory of your project (same folder as `package.json`)

2. Open `.env` in a text editor and add these lines:

   ```env
   # Supabase Database (REQUIRED)
   # Copy these from Supabase ORMs tab > Prisma (with [YOUR-PASSWORD] replaced)
   # DATABASE_URL: Connection Pooling (port 6543) - for the app
   DATABASE_URL="postgresql://postgres.gtsxtqluqkojqbltgakr:YOUR-ACTUAL-PASSWORD@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   # DIRECT_URL: Direct Connection (port 5432) - for migrations only
   DIRECT_URL="postgresql://postgres.gtsxtqluqkojqbltgakr:YOUR-ACTUAL-PASSWORD@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"

   # Admin Access (REQUIRED)
   ADMIN_PASSWORD=choose-a-secure-password

   # App URL (REQUIRED for local development)
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # YouTube API (REQUIRED for video syncing)
   YOUTUBE_API_KEY=your-youtube-api-key

   # Roblox (Optional)
   ROBLOX_PLACE_ID=your-roblox-place-id

   # TikTok API (Optional)
   TIKTOK_CLIENT_KEY=optional
   TIKTOK_CLIENT_SECRET=optional
   ```

   **Important:**
   - Replace `YOUR-ACTUAL-PASSWORD` in both `DATABASE_URL` and `DIRECT_URL` with your actual Supabase database password
   - The `DATABASE_URL` should use port **6543** with `?pgbouncer=true` (connection pooling)
   - The `DIRECT_URL` should use port **5432** (direct connection for migrations)
   - Replace the project reference (e.g., `gtsxtqluqkojqbltgakr`) with your actual Supabase project reference
   - Choose a secure password for `ADMIN_PASSWORD` (this is for accessing the admin dashboard)
   - You can skip `YOUTUBE_API_KEY` for now and add it later in Step 3

## Step 3: Get YouTube API Key

1. Go to https://console.cloud.google.com
2. Create a new project (or select existing)
3. Enable **YouTube Data API v3**:
   - Go to "APIs & Services" > "Library"
   - Search for "YouTube Data API v3"
   - Click "Enable"
4. Create credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the API key
   - (Optional) Restrict the key to YouTube Data API v3
5. Add the key to your `.env` file as `YOUTUBE_API_KEY`

## Step 4: Set Up Database Schema

Run this command to push the schema to your Supabase database:

```bash
npm run db:push
```

This will create all the necessary tables in your database.

## Step 5: Start Development Server

```bash
npm run dev
```

The app will be available at http://localhost:3000

## Step 6: Test the Setup

1. **Test Registration:**
   - Go to http://localhost:3000/join
   - Register a test participant
   - Copy the dashboard link

2. **Test Admin:**
   - Go to http://localhost:3000/admin
   - Login with your `ADMIN_PASSWORD`

3. **Test API:**
   - The cron jobs will run automatically in production
   - For local testing, you can manually trigger:
     - http://localhost:3000/api/cron/sync-videos
     - http://localhost:3000/api/cron/roblox-ccu

## Step 7: Deploy to Vercel

### 7.1: Prepare Your Code for Deployment

1. **Create a GitHub Repository:**
   - Go to https://github.com and create a new repository
   - Name it something like `tiktok-challenge-platform`
   - Don't initialize with README (you already have one)
   - Make it public or private (your choice)

2. **Push Your Code to GitHub:**
   ```bash
   # Initialize git if not already done
   git init
   
   # Add all files
   git add .
   
   # Commit
   git commit -m "Initial commit: TikTok Challenge Platform"
   
   # Add your GitHub repository as remote
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   
   # Push to GitHub
   git branch -M main
   git push -u origin main
   ```

3. **Verify `.gitignore` is working:**
   - Make sure `.env` is NOT committed to GitHub (it should be in `.gitignore`)
   - Your `.env` file contains sensitive information and should never be pushed

### 7.2: Set Up Vercel Account

1. Go to https://vercel.com
2. Sign up or log in (you can use your GitHub account for easy integration)
3. If using GitHub, authorize Vercel to access your repositories

### 7.3: Import Your Project

1. **Import Repository:**
   - Click "Add New..." → "Project"
   - Find your repository in the list (or search for it)
   - Click "Import" next to your repository

2. **Configure Project:**
   - **Framework Preset:** Next.js (should auto-detect)
   - **Root Directory:** `./` (leave as default)
   - **Build Command:** `npm run build` (should auto-detect)
   - **Output Directory:** `.next` (should auto-detect)
   - **Install Command:** `npm install` (should auto-detect)

3. **Environment Variables:**
   - **DO NOT click "Deploy" yet!** First, add all your environment variables
   - Click "Environment Variables" section
   - Add each variable from your `.env` file one by one:

     **Required Variables:**
     ```
     DATABASE_URL = (your Supabase connection pooling URL with password)
     DIRECT_URL = (your Supabase direct connection URL with password)
     ADMIN_PASSWORD = (your admin password)
     YOUTUBE_API_KEY = (your YouTube API key)
     ```

     **Important for NEXT_PUBLIC_APP_URL:**
     - **Skip this for now** - You'll set it after the first deployment
     - This variable is used to generate dashboard links for participants
     - You'll update it in Step 7.5 after you get your production URL

     **Optional Variables:**
     ```
     ROBLOX_PLACE_ID = (your Roblox place ID, if you have it)
     TIKTOK_CLIENT_KEY = (if you have TikTok API access)
     TIKTOK_CLIENT_SECRET = (if you have TikTok API access)
     CRON_SECRET = (generate a random string for cron security)
     ```

   - **Important:** For each variable, select which environments it applies to:
     - ✅ Production
     - ✅ Preview
     - ✅ Development (optional, for local testing)

4. **Generate CRON_SECRET (Recommended):**
   - Generate a random string for `CRON_SECRET`:
     ```bash
     # On Mac/Linux:
     openssl rand -base64 32
     
     # Or use an online generator: https://randomkeygen.com/
     ```
   - Add it as an environment variable in Vercel

### 7.4: Deploy

1. **Click "Deploy"**
   - Vercel will:
     - Install dependencies
     - Run `npm run build`
     - Deploy your app
   - This takes 2-5 minutes

2. **Wait for Build to Complete:**
   - Watch the build logs in real-time
   - If there are errors, check the logs and fix them
   - Common issues:
     - Missing environment variables
     - Database connection errors
     - Build errors in your code

3. **Get Your Production URL:**
   - Once deployed, Vercel will show you a URL like: `https://your-project.vercel.app`
   - This is your production URL!

### 7.5: Update NEXT_PUBLIC_APP_URL (REQUIRED)

**You MUST set this after deployment** - Dashboard links won't work correctly without it!

1. **Get Your Production URL:**
   - After deployment completes, copy your production URL
   - It will be something like: `https://your-project.vercel.app`

2. **Add NEXT_PUBLIC_APP_URL:**
   - Go to Vercel dashboard → Your project → "Settings" → "Environment Variables"
   - Click "Add New"
   - Variable name: `NEXT_PUBLIC_APP_URL`
   - Value: `https://your-project.vercel.app` (use your actual URL)
   - Select environments: ✅ Production, ✅ Preview
   - Click "Save"

3. **Redeploy:**
   - Go to "Deployments" tab
   - Click the three dots (⋯) on your latest deployment
   - Click "Redeploy"
   - This ensures the new environment variable is used

**Why this is important:**
- This URL is used to generate dashboard links when participants register
- Without it, dashboard links will point to `http://localhost:3000` (which won't work)
- After setting this, all new registrations will get correct dashboard links

### 7.6: Set Up Cron Jobs

1. **Verify Cron Configuration:**
   - Your `vercel.json` file should already have cron jobs configured:
     ```json
     {
       "crons": [
         {
           "path": "/api/cron/sync-videos",
           "schedule": "0 * * * *"
         },
         {
           "path": "/api/cron/roblox-ccu",
           "schedule": "*/5 * * * *"
         }
       ]
     }
     ```

2. **Enable Cron Jobs in Vercel:**
   - Go to your project in Vercel dashboard
   - Click on "Settings" → "Cron Jobs"
   - Vercel should automatically detect cron jobs from `vercel.json`
   - If not showing, you may need to:
     - Redeploy your project
     - Or manually add them in Vercel dashboard

3. **Secure Cron Jobs (Recommended):**
   - In your cron job routes, add authentication using `CRON_SECRET`
   - The routes already check for `CRON_SECRET` if it's set
   - Make sure `CRON_SECRET` is set in Vercel environment variables

### 7.7: Post-Deployment Checklist

1. **Test Your Production Site:**
   - Visit your production URL
   - Test the main page loads
   - Test registration at `/join`
   - Test admin login at `/admin`

2. **Verify Database Connection:**
   - Try registering a test participant
   - Check if it saves to your Supabase database
   - View in Supabase dashboard: Table Editor → `Participant` table

3. **Test Cron Jobs:**
   - Wait for the cron job to run (or trigger manually)
   - For manual testing, visit:
     - `https://your-project.vercel.app/api/cron/sync-videos`
     - `https://your-project.vercel.app/api/cron/roblox-ccu`
   - Check Vercel logs to see if cron jobs are running

4. **Set Up Custom Domain (Optional):**
   - In Vercel project settings → "Domains"
   - Add your custom domain
   - Follow DNS configuration instructions

### 7.8: Monitor and Maintain

1. **View Logs:**
   - Go to Vercel dashboard → Your project → "Logs"
   - Monitor for errors or issues

2. **Check Cron Job Status:**
   - Vercel dashboard → Your project → "Cron Jobs"
   - See execution history and status

3. **Database Monitoring:**
   - Monitor your Supabase database usage
   - Check connection pool usage
   - Review query performance if needed

### Troubleshooting Deployment

**Build Fails:**
- Check build logs in Vercel
- Common issues:
  - Missing environment variables
  - TypeScript errors
  - Missing dependencies
  - Database connection issues

**Cron Jobs Not Running:**
- Verify `vercel.json` is in the root directory
- Check Vercel cron jobs are enabled
- Verify `CRON_SECRET` is set if you're using it
- Check cron job logs in Vercel dashboard

**Database Connection Errors:**
- Verify `DATABASE_URL` and `DIRECT_URL` are correct in Vercel
- Check Supabase project is active
- Verify connection strings have correct passwords
- Check Supabase connection pool limits

**Environment Variables Not Working:**
- Make sure variables are set for "Production" environment
- Redeploy after adding new variables
- Check variable names match exactly (case-sensitive)

## Troubleshooting

### Database Connection Issues
- Verify your `DATABASE_URL` is correct
- Check that your Supabase project is active
- Ensure the password in the connection string matches your database password

### YouTube API Errors
- Verify your API key is correct
- Check API quota limits in Google Cloud Console
- Ensure YouTube Data API v3 is enabled

### Prisma Errors
- Run `npm run db:generate` again
- Try `npm run db:push` to sync schema
- Check that `DATABASE_URL` is set correctly

## Next Steps After Setup

1. **Configure Cron Jobs:**
   - In Vercel, verify cron jobs are set up (check Vercel dashboard)
   - Add `CRON_SECRET` environment variable for security

2. **Test Video Syncing:**
   - Register a participant with a YouTube channel
   - Wait for cron job to run (or trigger manually)
   - Check admin dashboard to see synced videos

3. **Customize:**
   - Update challenge dates in `app/page.tsx`
   - Adjust Robux budget in `lib/robux.ts` (currently 50,000)
   - Customize eligibility rules in `lib/eligibility.ts`

