# Cron Job Alternatives for Vercel Hobby Plan

Since Vercel's free Hobby plan only allows daily cron jobs, here are alternatives if you need more frequent video syncing:

## Current Setup (Daily - Works with Hobby Plan)

- **Schedule:** `0 0 * * *` (once per day at midnight UTC)
- **Cost:** Free
- **Limitation:** Videos sync once per day

## Alternative 1: External Cron Service (Free)

### Using cron-job.org (Free)

1. **Sign up:** Go to https://cron-job.org (free account)
2. **Create cron job:**
   - URL: `https://your-project.vercel.app/api/cron/sync-videos`
   - Schedule: Every hour (`0 * * * *`)
   - Method: GET
   - If using CRON_SECRET: Add header `Authorization: Bearer YOUR_CRON_SECRET`

3. **Create second cron job for CCU:**
   - URL: `https://your-project.vercel.app/api/cron/roblox-ccu`
   - Schedule: Every 5 minutes (`*/5 * * * *`)
   - Method: GET

**Pros:**
- Free
- Can run as frequently as needed
- Easy to set up

**Cons:**
- External dependency
- Need to configure CRON_SECRET if using it

### Using EasyCron (Free tier available)

1. Sign up at https://www.easycron.com
2. Similar setup to cron-job.org
3. Free tier allows limited cron jobs

## Alternative 2: Upgrade to Vercel Pro

- **Cost:** ~$20/month
- **Benefit:** Allows hourly cron jobs
- **Setup:** Change `vercel.json` schedule back to `"0 * * * *"` for hourly

## Alternative 3: Manual Triggering

Create an admin button to manually trigger syncs:

1. Add to admin dashboard:
   ```typescript
   const triggerSync = async () => {
     await fetch('/api/cron/sync-videos')
     // Show success message
   }
   ```

2. Admin can click button to sync videos on demand

## Alternative 4: Client-Side Polling (Not Recommended)

- Have the main page poll the API periodically
- Not ideal for server resources
- Only works when users are on the site

## Recommended Approach

For a challenge platform:
- **Daily sync is usually sufficient** - participants don't need real-time updates
- If you need more frequent updates, use **External Cron Service (Option 1)**
- Keep daily Vercel cron as backup

## Updating vercel.json for Pro Plan

If you upgrade to Vercel Pro, you can change `vercel.json`:

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

