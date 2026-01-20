# Cron Job Setup for Video Views Update

This guide explains how to set up the video views update cron job using cron-job.org.

## Endpoint

The cron job endpoint is: `/api/cron/update-video-views`

Full URL: `https://your-project.vercel.app/api/cron/update-video-views`

## Setup Instructions for cron-job.org

### Step 1: Create Account
1. Go to https://cron-job.org
2. Sign up for a free account
3. Verify your email

### Step 2: Create Cron Job

1. **Click "Create cronjob"**

2. **Configure the cron job:**
   - **Title:** `Update Video Views`
   - **Address (URL):** 
     ```
     https://your-project.vercel.app/api/cron/update-video-views
     ```
     Replace `your-project` with your actual Vercel project name/domain

3. **Schedule:**
   - Select "Every X minutes"
   - Enter `5` minutes

4. **Request Method:** `GET`

5. **Authentication (Optional but Recommended):**
   
   **Option A: Using Query Parameter (Easier)**
   - Add query parameter: `?secret=YOUR_CRON_SECRET`
   - Full URL: `https://your-project.vercel.app/api/cron/update-video-views?secret=YOUR_CRON_SECRET`
   - Replace `YOUR_CRON_SECRET` with your actual secret from Vercel environment variables
   
   **Option B: Using Authorization Header**
   - Click "Add Header"
   - Name: `Authorization`
   - Value: `Bearer YOUR_CRON_SECRET`
   - Replace `YOUR_CRON_SECRET` with your actual secret

6. **Click "Create cronjob"**

### Step 3: Set CRON_SECRET in Vercel

1. Go to Vercel → Your Project → Settings → Environment Variables
2. Add new variable:
   - **Name:** `CRON_SECRET`
   - **Value:** Generate a secure random string (see below)
   - **Environments:** Production, Preview
3. Save and redeploy

**Generate a secure secret:**
```bash
# On Mac/Linux:
openssl rand -base64 32

# On Windows (PowerShell):
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

### Step 4: Test the Cron Job

1. In cron-job.org, click "Run now" on your cron job
2. Check Vercel logs to see if it executed successfully
3. Check your database to verify views are being updated

## What This Cron Job Does

- Runs every 5 minutes
- Fetches all videos from the database
- For each video:
  - **YouTube:** Fetches latest view count from YouTube API
  - **TikTok:** Scrapes the video page for latest view count
- Updates the `views` field in the database
- Updates `lastSyncedAt` timestamp

## Monitoring

- **cron-job.org Dashboard:** View execution history and status
- **Vercel Logs:** Check API logs to see requests and any errors
- **Database:** Verify views are being updated by checking video records

## Troubleshooting

### Getting 401 Unauthorized
- Make sure `CRON_SECRET` is set in Vercel environment variables
- Verify the secret matches between Vercel and cron-job.org
- If using query parameter, ensure the URL format is: `?secret=YOUR_SECRET`
- If using header, ensure format is: `Bearer YOUR_SECRET`

### Cron Job Not Running
- Check that the cron job is enabled (toggle should be ON)
- Verify the URL is correct (test by visiting it in browser)
- Check Vercel logs for any errors
- Ensure the schedule is set correctly (every 5 minutes)

### Views Not Updating
- Check Vercel function logs for errors
- Verify YouTube API key is set (for YouTube videos)
- Check if TikTok scraping is working (may fail due to rate limiting)
- Verify database connection is working

## Security Note

The `CRON_SECRET` is optional but highly recommended. Without it, anyone who knows the URL can trigger the endpoint. With it, only requests with the correct secret can execute the job.
