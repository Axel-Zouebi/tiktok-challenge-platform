# Discord Video Submission Bot

A Discord bot that automatically monitors a Discord channel for YouTube/TikTok video links and submits them to the web app.

## Features

- Automatically detects YouTube and TikTok video URLs in Discord messages
- Extracts Discord username from message author
- Submits videos to the web app API
- Creates participants automatically if they don't exist
- Handles multiple video links in a single message

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

Required environment variables:
- `DISCORD_BOT_TOKEN` - Your Discord bot token (get from [Discord Developer Portal](https://discord.com/developers/applications))
- `DISCORD_CHANNEL_ID` - The ID of the Discord channel to monitor
- `DISCORD_GUILD_ID` - Your Discord server ID (optional, but recommended)
- `WEB_APP_URL` - URL of the web app API (default: `http://localhost:3000`)
- `YOUTUBE_API_KEY` - YouTube Data API v3 key (for fetching video metadata)

Optional:
- `API_SECRET` - Secret for authenticating with the web app API

### 3. Create a Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to the "Bot" section
4. Create a bot and copy the token
5. **IMPORTANT: Enable Required Intents**
   - Scroll down to **"Privileged Gateway Intents"**
   - ✅ Enable **MESSAGE CONTENT INTENT** (REQUIRED - without this you'll get "Used disallowed intents" error)
   - ✅ Enable **SERVER MEMBERS INTENT** (optional, but recommended)
   - Changes save automatically
6. Invite the bot to your server with the following permissions:
   - Read Messages
   - Send Messages
   - Read Message History

**⚠️ If you get "Used disallowed intents" error, see `FIX_INTENTS.md` for detailed instructions.**

### 4. Get Channel ID

1. Enable Developer Mode in Discord (User Settings > Advanced > Developer Mode)
2. Right-click on the channel you want to monitor
3. Click "Copy ID"
4. Paste it into `DISCORD_CHANNEL_ID` in your `.env` file

### 5. Run the Bot

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## How It Works

1. The bot monitors the configured Discord channel for new messages
2. When a message contains a YouTube or TikTok URL, it extracts:
   - The video URL
   - The Discord username from the message author
   - The platform (YouTube or TikTok)
3. The bot submits the video to `/api/videos/submit` endpoint
4. The web app:
   - Finds or creates a participant by Discord username
   - Extracts video metadata (YouTube API or URL parsing for TikTok)
   - Creates the video entry
   - Calculates eligibility

## Supported URL Formats

### YouTube
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`
- `https://www.youtube.com/v/VIDEO_ID`

### TikTok
- `https://www.tiktok.com/@username/video/VIDEO_ID`
- `https://vm.tiktok.com/VIDEO_ID`
- `https://www.tiktok.com/t/VIDEO_ID`

## Error Handling

The bot logs all errors to the console. Failed submissions are logged but don't interrupt the bot's operation.

## Rate Limiting

The bot processes videos sequentially to avoid overwhelming the API. Multiple videos in a single message are processed one at a time.

## Troubleshooting

### Bot doesn't respond to messages
- Check that `DISCORD_BOT_TOKEN` is correct
- Verify the bot has MESSAGE CONTENT INTENT enabled
- Ensure the bot is in the correct channel
- Check that `DISCORD_CHANNEL_ID` matches the channel you want to monitor

### Videos not submitting
- Verify `WEB_APP_URL` is correct and the web app is running
- Check that the `/api/videos/submit` endpoint is accessible
- Review console logs for error messages
- Ensure `YOUTUBE_API_KEY` is set if submitting YouTube videos

### Bot crashes
- Check all required environment variables are set
- Verify Discord bot token is valid
- Ensure Node.js version is compatible (v18+ recommended)

## Development

The bot uses TypeScript and `tsx` for execution. For development, use `npm run dev` which watches for file changes and automatically restarts the bot.

## License

Same as the main project.

