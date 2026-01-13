# Quick Setup: 5-Minute Sync with cron-job.org

Follow these exact steps to set up video syncing every 5 minutes using cron-job.org.

## Prerequisites

- Your Vercel project is deployed and running
- You have your production URL (e.g., `https://your-project.vercel.app`)

## Step 1: Sign Up for cron-job.org

1. Go to https://cron-job.org
2. Click **"Sign Up"** (top right)
3. Create a free account (email + password)
4. Verify your email address
5. Log in

## Step 2: Create Video Sync Cron Job

1. After logging in, click **"Create cronjob"** button
2. Fill in the form:

   **Basic Settings:**
   - **Title:** `TikTok Challenge - Video Sync`
   - **Address (URL):** 
     ```
     https://your-project.vercel.app/api/cron/sync-videos
     ```
     ⚠️ **Replace `your-project` with your actual Vercel project name!**
   
   **Schedule:**
   - Click the dropdown next to "Schedule"
   - Select **"Every X minutes"**
   - Enter `5` in the minutes field
   
   **Request Settings:**
   - **Request Method:** Select **GET**
   - Leave other fields as default

3. **If you set CRON_SECRET (Optional but Recommended):**
   - Scroll down to **"Request Headers"**
   - Click **"Add Header"**
   - **Name:** `Authorization`
   - **Value:** `Bearer YOUR_CRON_SECRET`
     - Replace `YOUR_CRON_SECRET` with the actual secret you set in Vercel
   - If you didn't set CRON_SECRET, skip this step

4. Click **"Create cronjob"** at the bottom

## Step 3: Create Roblox CCU Cron Job

1. Click **"Create cronjob"** again
2. Fill in the form:

   **Basic Settings:**
   - **Title:** `TikTok Challenge - Roblox CCU`
   - **Address (URL):** 
     ```
     https://your-project.vercel.app/api/cron/roblox-ccu
     ```
     ⚠️ **Replace `your-project` with your actual Vercel project name!**
   
   **Schedule:**
   - Select **"Every X minutes"**
   - Enter `5` minutes
   
   **Request Settings:**
   - **Request Method:** **GET**
   - **Request Headers (if using CRON_SECRET):** Same as Step 2

3. Click **"Create cronjob"**

## Step 4: Test Your Cron Jobs

1. **Test Video Sync:**
   - Find your "Video Sync" cron job in the list
   - Click the **"Run now"** button (play icon)
   - Wait a few seconds
   - Check the "Last execution" status - should show success ✅

2. **Test Roblox CCU:**
   - Find your "Roblox CCU" cron job
   - Click **"Run now"**
   - Check status

3. **Verify in Vercel:**
   - Go to your Vercel dashboard
   - Click on your project → **"Logs"** tab
   - You should see API requests coming through
   - Check for any errors

4. **Verify in Database:**
   - Go to your Supabase dashboard
   - Check if videos are being synced (if you have participants registered)
   - Check `roblox_metrics` table for CCU data

## Step 5: Monitor Your Cron Jobs

- **cron-job.org Dashboard:**
  - View execution history
  - See success/failure rates
  - Check last execution time

- **Vercel Logs:**
  - Monitor API performance
  - Check for errors

- **Database:**
  - Verify data is being updated

## Troubleshooting

### Cron job shows "Failed"
- **Check the URL:** Make sure it's correct and your Vercel app is deployed
- **Test manually:** Visit the URL in your browser - should return JSON
- **Check CRON_SECRET:** If you set it, make sure it matches in both places

### Getting 401 Unauthorized
- Verify `CRON_SECRET` is set in Vercel environment variables
- Verify the Authorization header in cron-job.org matches: `Bearer YOUR_SECRET`
- The secret must be exactly the same in both places

### Videos not syncing
- Check Vercel function logs for errors
- Verify `YOUTUBE_API_KEY` is set in Vercel
- Check if participants have registered channels
- Verify database connection is working

### Cron job not running automatically
- Make sure the schedule is set to "Every 5 minutes"
- Check that the cron job is enabled (toggle should be ON)
- Free accounts may have rate limits - check cron-job.org limits

## What Happens Now?

✅ **Every 5 minutes:**
- Videos from registered YouTube/TikTok channels are synced
- Roblox CCU is updated
- Eligibility is recalculated
- Leaderboards are updated

✅ **Daily (backup):**
- Vercel cron jobs still run once per day as backup

## Next Steps

1. ✅ Cron jobs are set up and running
2. Register test participants to see syncing in action
3. Monitor the first few syncs to ensure everything works
4. Adjust schedule if needed (can change to 10 minutes, 15 minutes, etc.)

---

**Need help?** Check the main `SETUP_EXTERNAL_CRON.md` for more details and alternative options.

