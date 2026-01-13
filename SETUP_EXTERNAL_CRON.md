# Set Up 5-Minute Video Sync (External Cron Service)

Since Vercel Hobby plan only allows daily cron jobs, we'll use a free external cron service to sync videos every 5 minutes.

## Step-by-Step Setup

### Option 1: Using cron-job.org (Recommended - Free)

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

### Option 2: Using EasyCron (Alternative)

1. Sign up at https://www.easycron.com (free tier available)
2. Similar setup process
3. Create cron jobs with 5-minute intervals

### Option 3: Using GitHub Actions (Free, but more complex)

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

## Security: Using CRON_SECRET

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

## Monitoring

- **Check cron-job.org dashboard:** See execution history and status
- **Check Vercel logs:** View API logs to see if requests are coming through
- **Check database:** Verify videos are being synced

## Troubleshooting

**Cron job not running:**
- Verify the URL is correct (test by visiting it in browser)
- Check if CRON_SECRET matches (if using it)
- Check Vercel logs for errors

**Getting 401 Unauthorized:**
- Make sure CRON_SECRET is set in both Vercel and external cron service
- Verify the Authorization header format: `Bearer YOUR_SECRET`

**Videos not syncing:**
- Check Vercel function logs
- Verify YouTube API key is set
- Check database connection

## Recommended Setup

For your use case (sync every 5 minutes):

1. **Use cron-job.org** (easiest, free)
2. **Set both jobs to run every 5 minutes**
3. **Optional:** Add CRON_SECRET for security
4. **Keep Vercel daily cron as backup** (in case external service fails)

This gives you:
- ✅ 5-minute sync frequency
- ✅ Free (no cost)
- ✅ Reliable external service
- ✅ Easy to monitor

