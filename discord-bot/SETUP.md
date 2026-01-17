# Quick Setup Guide

## ✅ Completed Steps

1. ✅ Database schema updated - `channelId` is now optional, `participantId` added to Video model
2. ✅ Bot dependencies installed
3. ✅ Code compiled successfully

## 🚀 Next Steps to Run the Bot

### 1. Create `.env` file

Copy the template and fill in your values:

```bash
cd discord-bot
cp env.template .env
```

Then edit `.env` with your actual values:

```env
DISCORD_BOT_TOKEN=your_actual_bot_token
DISCORD_CHANNEL_ID=your_channel_id
WEB_APP_URL=http://localhost:3000
YOUTUBE_API_KEY=your_youtube_api_key
```

### 2. Get Discord Bot Token

1. Go to https://discord.com/developers/applications
2. Create a new application or select existing one
3. Go to "Bot" section
4. Create a bot and copy the token
5. Enable "MESSAGE CONTENT INTENT" (required!)
6. Invite bot to your server with these permissions:
   - Read Messages
   - Send Messages
   - Read Message History

### 3. Get Channel ID

1. Enable Developer Mode in Discord (User Settings > Advanced > Developer Mode)
2. Right-click the channel you want to monitor
3. Click "Copy ID"
4. Paste into `DISCORD_CHANNEL_ID` in `.env`

### 4. Start the Bot

Development mode (with auto-reload):
```bash
npm run bot:dev
```

Production mode:
```bash
npm run bot
```

Or from the bot directory:
```bash
cd discord-bot
npm start
```

## 🧪 Testing

1. Make sure your web app is running (`npm run dev` in the root directory)
2. Start the Discord bot
3. Post a YouTube or TikTok URL in the configured Discord channel
4. Check the bot console for submission logs
5. Check the web app dashboard to see the submitted video

## 📝 Notes

- The bot will automatically create participants if they don't exist
- Videos are linked directly to participants (no channels required)
- The bot processes videos sequentially to avoid API rate limits
- All errors are logged to the console

## 🐛 Troubleshooting

**Bot doesn't respond:**
- Check `DISCORD_BOT_TOKEN` is correct
- Verify MESSAGE CONTENT INTENT is enabled
- Ensure bot is in the correct channel
- Check `DISCORD_CHANNEL_ID` matches the channel

**Videos not submitting:**
- Verify `WEB_APP_URL` is correct and web app is running
- Check console logs for error messages
- Ensure `YOUTUBE_API_KEY` is set for YouTube videos

