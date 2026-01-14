# Complete Setup Guide

Follow these steps to get your challenge platform running from scratch to deployment.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Set Up Supabase Database with Prisma](#step-1-set-up-supabase-database-with-prisma)
3. [Step 2: Create Environment Variables File](#step-2-create-environment-variables-file)
4. [Step 3: Get YouTube API Key](#step-3-get-youtube-api-key)
5. [Step 4: Get TikTok API Credentials (Optional)](#step-4-get-tiktok-api-credentials-optional)
6. [Step 5: Set Up Database Schema](#step-5-set-up-database-schema)
7. [Step 6: Start Development Server](#step-6-start-development-server)
8. [Step 7: Test the Setup](#step-7-test-the-setup)
9. [Step 8: Deploy to Vercel](#step-8-deploy-to-vercel)
10. [Step 9: Set Up Cron Jobs](#step-9-set-up-cron-jobs)
11. [Troubleshooting](#troubleshooting)
12. [Next Steps After Setup](#next-steps-after-setup)

---

## Prerequisites

- Node.js 18+ and npm installed
- A Supabase account (free tier works)
- A Google Cloud account (for YouTube API)
- A GitHub account (for deployment)
- A Vercel account (free tier works)

---

## Step 1: Set Up Supabase Database with Prisma

### 1.1: Create Supabase Project

1. Go to https://supabase.com and create a new project (or use existing)
2. Wait for the project to be ready (takes ~2 minutes)
3. Note your database password (you'll need it later)

### 1.2: Get Connection Strings

1. Go to **Project Settings** > **Database**
2. Click on the **"ORMs"** tab (not "Connection String")
3. Select **"Prisma"** from the dropdown
4. You'll see two connection strings:

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

5. **Important:** Make sure to replace `[YOUR-PASSWORD]` in BOTH strings with your actual Supabase database password

### 1.3: Why Two Connection Strings?

- **DATABASE_URL** (port 6543): Uses connection pooling (PgBouncer) - optimized for serverless/server apps that make many connections
- **DIRECT_URL** (port 5432): Direct database connection - required for Prisma migrations which need direct access

---

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

   # Cron Security (Optional, but recommended for production)
   CRON_SECRET=optional-random-string
   ```

   **Important:**
   - Replace `YOUR-ACTUAL-PASSWORD` in both `DATABASE_URL` and `DIRECT_URL` with your actual Supabase database password
   - The `DATABASE_URL` should use port **6543** with `?pgbouncer=true` (connection pooling)
   - The `DIRECT_URL` should use port **5432** (direct connection for migrations)
   - Replace the project reference (e.g., `gtsxtqluqkojqbltgakr`) with your actual Supabase project reference
   - Choose a secure password for `ADMIN_PASSWORD` (this is for accessing the admin dashboard)
   - You can skip `YOUTUBE_API_KEY` for now and add it later in Step 3

---

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

---

## Step 4: Get TikTok API Credentials (Optional)

The platform supports TikTok API integration, but requires OAuth setup. If not available, the system will use manual submission mode.

### 4.1: Register for TikTok Developer Account

1. Go to [TikTok for Developers](https://developers.tiktok.com/)
2. Sign in with your TikTok account
3. Complete the developer registration form to create your developer account

### 4.2: Create a New Application

1. In your developer dashboard, click on **"Manage apps"**
2. Click **"Create App"**
3. Fill in the required details for your application:
   - App name
   - App description
   - Category
   - Website URL
4. **Important**: Specify your Redirect URI(s):
   - For local development: `http://localhost:3000/api/auth/tiktok/callback`
   - For production: `https://yourdomain.com/api/auth/tiktok/callback`
   - Ensure these URIs are absolute and begin with `https` or `http`

### 4.3: Get Your Client Key and Client Secret

1. Once your application is created, navigate to **"App Details"** or **"Basic Information"** section
2. You'll find your **Client Key** (also called App ID) - this is visible immediately
3. To get your **Client Secret**:
   - Look for the "Client Secret" field
   - Click the eye icon (👁️) to reveal it
   - **Important**: Copy this immediately - you may not be able to view it again!

### 4.4: Add Credentials to Your `.env` File

Add or update these lines in your `.env` file:

```env
TIKTOK_CLIENT_KEY=your_actual_client_key_here
TIKTOK_CLIENT_SECRET=your_actual_client_secret_here
```

⚠️ **Security Warning:**
- Never commit your `.env` file to Git (it's already in `.gitignore`)
- Never share your Client Secret publicly
- Keep these credentials secure

📝 **Note:**
- TikTok API requires OAuth approval process
- Some APIs may require additional permissions or approval
- The current implementation in `lib/api/tiktok.ts` is a placeholder that will need OAuth flow implementation
- If TikTok API keys are not configured, the system will automatically use manual submission mode

---

## Step 5: Set Up Database Schema

Run this command to push the schema to your Supabase database:

```bash
npm run db:push
```

This will create all the necessary tables in your database.

**Troubleshooting Database Connection:**
- If you get "Can't reach database server" error:
  - Check your password: Make sure you replaced `[YOUR-PASSWORD]` with your actual password
  - Check the URLs: Verify both URLs are correct and match what Supabase shows
  - Check project status: Ensure your Supabase project is active and not paused
  - Try the direct connection: Test if `DIRECT_URL` works by temporarily using it for both

---

## Step 6: Start Development Server

```bash
npm run dev
```

The app will be available at http://localhost:3000

---

## Step 7: Test the Setup

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

---

## Step 8: Deploy to Vercel

### 8.1: Prepare Your Code for Deployment

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

### 8.2: Set Up Vercel Account

1. Go to https://vercel.com
2. Sign up or log in (you can use your GitHub account for easy integration)
3. If using GitHub, authorize Vercel to access your repositories

### 8.3: Import Your Project

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
     - You'll update it in Step 8.5 after you get your production URL

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
     
     # On Windows (PowerShell):
     -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
     
     # Or use an online generator: https://randomkeygen.com/
     ```
   - Add it as an environment variable in Vercel

### 8.4: Deploy

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

### 8.5: Update NEXT_PUBLIC_APP_URL (REQUIRED)

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

### 8.6: Post-Deployment Checklist

1. **Test Your Production Site:**
   - Visit your production URL
   - Test the main page loads
   - Test registration at `/join`
   - Test admin login at `/admin`

2. **Verify Database Connection:**
   - Try registering a test participant
   - Check if it saves to your Supabase database
   - View in Supabase dashboard: Table Editor → `Participant` table

3. **Set Up Custom Domain (Optional):**
   - In Vercel project settings → "Domains"
   - Add your custom domain
   - Follow DNS configuration instructions

---

## Step 9: Set Up Cron Jobs

Vercel's free Hobby plan only allows daily cron jobs. For more frequent syncing (every 5 minutes), you'll need to use an external cron service.

### 9.1: Vercel Cron Jobs (Daily - Free)

Your `vercel.json` file should already have cron jobs configured:

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

**Note:** On Vercel Hobby plan, the minimum schedule is daily (`0 0 * * *`). The hourly schedule above requires Vercel Pro.

**Enable Cron Jobs in Vercel:**
- Go to your project in Vercel dashboard
- Click on "Settings" → "Cron Jobs"
- Vercel should automatically detect cron jobs from `vercel.json`
- If not showing, you may need to:
  - Redeploy your project
  - Or manually add them in Vercel dashboard

### 9.2: External Cron Service (5-Minute Sync - Free)

For more frequent syncing, use an external cron service like cron-job.org:

#### Option 1: Using cron-job.org (Recommended - Free)

1. **Sign Up:**
   - Go to https://cron-job.org
   - Click "Sign Up" (free account)
   - Verify your email

2. **Create Cron Job for Video Sync:**
   - Click "Create cronjob"
   - **Title:** `TikTok Challenge - Video Sync`
   - **Address (URL):** `https://your-project.vercel.app/api/cron/sync-videos`
     - Replace `your-project` with your actual Vercel project name
   - **Schedule:** 
     - Select "Every X minutes"
     - Enter `5` minutes
   - **Request Method:** GET
   - **Request Headers (if using CRON_SECRET):**
     - Click "Add Header"
     - Name: `Authorization`
     - Value: `Bearer YOUR_CRON_SECRET`
     - (Only if you set CRON_SECRET in Vercel)
   - Click "Create cronjob"

3. **Create Cron Job for Roblox CCU:**
   - Click "Create cronjob" again
   - **Title:** `TikTok Challenge - Roblox CCU`
   - **Address (URL):** `https://your-project.vercel.app/api/cron/roblox-ccu`
   - **Schedule:** Every `5` minutes
   - **Request Method:** GET
   - **Request Headers (if using CRON_SECRET):** Same as above
   - Click "Create cronjob"

4. **Test the Cron Jobs:**
   - Click "Run now" on each cron job to test
   - Check Vercel logs to verify they're working
   - Check your database to see if videos are syncing

#### Option 2: Using EasyCron (Alternative)

1. Sign up at https://www.easycron.com (free tier available)
2. Similar setup process
3. Create cron jobs with 5-minute intervals

#### Option 3: Using GitHub Actions (Free, but more complex)

If you want to keep everything in your codebase, you can use GitHub Actions:

1. Create `.github/workflows/sync-videos.yml`:
   ```yaml
   name: Sync Videos
   on:
     schedule:
       - cron: '*/5 * * * *'  # Every 5 minutes
     workflow_dispatch:  # Allow manual trigger
   
   jobs:
     sync:
       runs-on: ubuntu-latest
       steps:
         - name: Trigger Video Sync
           run: |
             curl -X GET "https://your-project.vercel.app/api/cron/sync-videos" \
               -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
   ```

2. Add `CRON_SECRET` to GitHub Secrets

### 9.3: Secure Cron Jobs (Recommended)

If you want to secure your cron endpoints:

1. **Generate a secret:**
   ```bash
   # On Mac/Linux:
   openssl rand -base64 32
   
   # On Windows (PowerShell):
   -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
   ```

2. **Add to Vercel:**
   - Go to Vercel → Your Project → Settings → Environment Variables
   - Add `CRON_SECRET` with your generated value
   - Select: Production, Preview

3. **Add to External Cron Service:**
   - In cron-job.org, add header:
     - Name: `Authorization`
     - Value: `Bearer YOUR_CRON_SECRET`

### 9.4: Monitoring Cron Jobs

- **Check cron-job.org dashboard:** See execution history and status
- **Check Vercel logs:** View API logs to see if requests are coming through
- **Check database:** Verify videos are being synced

### 9.5: Cron Job Alternatives Summary

| Option | Frequency | Cost | Setup Complexity |
|--------|-----------|------|------------------|
| Vercel Hobby | Daily | Free | Easy (automatic) |
| Vercel Pro | Hourly | ~$20/month | Easy (automatic) |
| cron-job.org | Every 5 min | Free | Easy |
| EasyCron | Every 5 min | Free tier | Easy |
| GitHub Actions | Every 5 min | Free | Medium |

**Recommended Setup:**
- Use **cron-job.org** for 5-minute sync (easiest, free)
- Keep Vercel daily cron as backup (in case external service fails)
- Add CRON_SECRET for security

---

## Troubleshooting

### Database Connection Issues

- Verify your `DATABASE_URL` is correct
- Check that your Supabase project is active
- Ensure the password in the connection string matches your database password
- Verify both URLs are correct and match what Supabase shows
- Check project status: Ensure your Supabase project is active and not paused
- If you get connection limit errors, make sure you're using the pooled connection (port 6543) for `DATABASE_URL`

### YouTube API Errors

- Verify your API key is correct
- Check API quota limits in Google Cloud Console
- Ensure YouTube Data API v3 is enabled

### TikTok API Not Working

- Verify your `.env` file exists in the root directory
- Check that variable names are exactly: `TIKTOK_CLIENT_KEY` and `TIKTOK_CLIENT_SECRET`
- Ensure there are no extra spaces around the `=` sign
- Restart your development server after updating `.env`
- The current code in `lib/api/tiktok.ts` shows that the OAuth flow is not yet fully implemented
- The system will fall back to manual submission mode if the API is not available

### Prisma Errors

- Run `npm run db:generate` again
- Try `npm run db:push` to sync schema
- Check that `DATABASE_URL` is set correctly

### Cron Jobs Not Running

- Verify `vercel.json` is in the root directory
- Check Vercel cron jobs are enabled
- Verify `CRON_SECRET` is set if you're using it
- Check cron job logs in Vercel dashboard
- For external cron services:
  - Verify the URL is correct (test by visiting it in browser)
  - Check if CRON_SECRET matches (if using it)
  - Check Vercel logs for errors
  - Make sure the schedule is set correctly
  - Check that the cron job is enabled (toggle should be ON)

### Getting 401 Unauthorized (Cron Jobs)

- Make sure CRON_SECRET is set in both Vercel and external cron service
- Verify the Authorization header format: `Bearer YOUR_SECRET`
- The secret must be exactly the same in both places

### Videos Not Syncing

- Check Vercel function logs
- Verify `YOUTUBE_API_KEY` is set in Vercel
- Check if participants have registered channels
- Verify database connection is working

### Build Fails (Deployment)

- Check build logs in Vercel
- Common issues:
  - Missing environment variables
  - TypeScript errors
  - Missing dependencies
  - Database connection issues

### Environment Variables Not Working

- Make sure variables are set for "Production" environment
- Redeploy after adding new variables
- Check variable names match exactly (case-sensitive)

---

## Next Steps After Setup

1. **Configure Cron Jobs:**
   - In Vercel, verify cron jobs are set up (check Vercel dashboard)
   - Add `CRON_SECRET` environment variable for security
   - Set up external cron service if you need 5-minute sync

2. **Test Video Syncing:**
   - Register a participant with a YouTube channel
   - Wait for cron job to run (or trigger manually)
   - Check admin dashboard to see synced videos

3. **Customize:**
   - Update challenge dates in `app/page.tsx`
   - Adjust Robux budget in `lib/robux.ts` (currently 50,000)
   - Customize eligibility rules in `lib/eligibility.ts`

4. **Monitor:**
   - View logs in Vercel dashboard
   - Check cron job status
   - Monitor database usage in Supabase
   - Review query performance if needed

---

## Quick Reference Checklist

- [ ] Supabase project created
- [ ] Database connection strings copied and added to `.env`
- [ ] Environment variables file created
- [ ] YouTube API key obtained and added
- [ ] TikTok API credentials added (optional)
- [ ] Database schema pushed (`npm run db:push`)
- [ ] Local development server running (`npm run dev`)
- [ ] Registration tested
- [ ] Admin login tested
- [ ] Code pushed to GitHub
- [ ] Project imported to Vercel
- [ ] All environment variables added to Vercel
- [ ] First deployment successful
- [ ] `NEXT_PUBLIC_APP_URL` set in Vercel
- [ ] Cron jobs configured (Vercel or external service)
- [ ] Production site tested
- [ ] Database connection verified in production

---

**Need more help?** Check the code comments or refer to the implementation details in the codebase.
