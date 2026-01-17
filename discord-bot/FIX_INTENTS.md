# Fix: "Used disallowed intents" Error

## Problem
The bot is trying to use intents that aren't enabled in your Discord bot application.

## Solution: Enable MESSAGE CONTENT INTENT

### Step 1: Go to Discord Developer Portal
1. Open https://discord.com/developers/applications
2. Select your bot application

### Step 2: Enable Required Intents
1. Go to the **"Bot"** section in the left sidebar
2. Scroll down to **"Privileged Gateway Intents"**
3. Enable the following intents:
   - ✅ **MESSAGE CONTENT INTENT** (REQUIRED - this is the one causing the error)
   - ✅ **SERVER MEMBERS INTENT** (optional, but recommended)

### Step 3: Save Changes
- The changes save automatically
- You may need to wait a few seconds for them to take effect

### Step 4: Restart Your Bot
```bash
# Stop the bot (Ctrl+C) and restart it
npm run bot:dev
```

## Why This Is Needed

Discord requires bots to explicitly request permission to read message content. This is a privacy/security feature. Without the MESSAGE CONTENT INTENT enabled, the bot cannot read the actual text of messages, only metadata.

## Verification

After enabling intents and restarting, you should see:
```
✅ Discord bot logged in as YourBot#1234
📺 Monitoring channel: [channel_id]
🌐 Web app URL: http://localhost:3000
```

If you still see the error, make sure:
1. You saved the changes in the Developer Portal
2. You're using the correct bot token
3. You waited a few seconds after enabling the intent

