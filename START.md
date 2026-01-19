# Quick Start Guide

## Running Both Services

You need **two terminal windows** to run both the web app and the Discord bot simultaneously.

### Terminal 1 - Web App
```bash
cd C:\Users\axelz\Documents\Tiktok-Challenge
npm run dev
```
This starts the Next.js web app on `http://localhost:3000`

### Terminal 2 - Discord Bot
```bash
cd C:\Users\axelz\Documents\discord-bot
npm run dev
```
This starts the Discord bot (it will automatically load `.env` from the current directory)

## Verify Everything is Working

1. **Web App**: Open `http://localhost:3000` in your browser - you should see the homepage
2. **Discord Bot**: Check the terminal - you should see:
   ```
   ✅ Discord bot logged in as YourBot#1234
   📺 Monitoring channel: [channel_id]
   🌐 Web app URL: http://localhost:3000
   ```

3. **Test**: Post a YouTube or TikTok URL in your configured Discord channel and watch the bot process it!

## Troubleshooting

- **Bot can't connect**: Make sure `DISCORD_BOT_TOKEN` is correct in `C:\Users\axelz\Documents\discord-bot\.env`
- **Bot doesn't respond**: Check that `DISCORD_CHANNEL_ID` matches your channel
- **Videos not submitting**: Verify `WEB_APP_URL` in `C:\Users\axelz\Documents\discord-bot\.env` matches where your web app is running

