# One Last Stand Creator Challenge Platform

A web platform for managing a TikTok & YouTube creator challenge for the Roblox game "One Last Stand". Participants create content with the hashtag `#trythemoon` and earn Robux rewards.

## Features

- **Participant Registration**: Token-based dashboard access (no login required)
- **Automatic Video Tracking**: Hourly sync of videos from YouTube and TikTok channels
- **Eligibility Engine**: Automatic evaluation of videos based on rules (duration, hashtag, views, daily limits)
- **Leaderboards**: Separate leaderboards for TikTok and YouTube, ranked by total views
- **Admin Dashboard**: Review videos, override eligibility, export data
- **Robux Tracking**: Real-time tracking of Robux budget (50,000 total)
- **Roblox CCU Display**: Live concurrent user count for the game

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui
- **Database**: Supabase PostgreSQL
- **ORM**: Prisma
- **Deployment**: Vercel
- **Cron Jobs**: Vercel Cron

## Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- YouTube Data API key
- TikTok API credentials (optional - manual submission fallback available)
- Roblox Place ID (optional - for CCU display)

## Setup Instructions

### 1. Clone and Install

```bash
git clone <repository-url>
cd Tiktok-Challenge
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at https://supabase.com
2. Go to Project Settings > Database
3. Copy the connection string (URI format)
4. You'll need both `DATABASE_URL` and `DIRECT_URL` (same value for migrations)

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase
DATABASE_URL=postgresql://user:password@host:port/database
DIRECT_URL=postgresql://user:password@host:port/database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# APIs
YOUTUBE_API_KEY=your-youtube-api-key
TIKTOK_CLIENT_KEY=your-tiktok-client-key (optional)
TIKTOK_CLIENT_SECRET=your-tiktok-client-secret (optional)
ROBLOX_PLACE_ID=your-roblox-place-id (optional)

# Admin
ADMIN_PASSWORD=your-secure-admin-password

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cron (optional, for production)
CRON_SECRET=your-random-secret-string
```

### 4. Get API Keys

#### YouTube Data API
1. Go to https://console.cloud.google.com
2. Create a new project or select existing
3. Enable "YouTube Data API v3"
4. Create credentials (API Key)
5. Add the key to `YOUTUBE_API_KEY`

#### TikTok API (Optional)
The platform supports TikTok API integration, but requires OAuth setup. If not available, the system will use manual submission mode. See `lib/api/tiktok.ts` for implementation details.

#### Roblox Place ID (Optional)
1. Find your Roblox game's Place ID
2. Add to `ROBLOX_PLACE_ID` environment variable

### 5. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (or use migrations)
npm run db:push

# Or create and run migrations
npm run db:migrate
```

### 6. Run Locally

```bash
npm run dev
```

The app will be available at http://localhost:3000

### 7. Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add all environment variables in Vercel dashboard
4. Deploy

#### Configure Vercel Cron Jobs

The `vercel.json` file is already configured with cron jobs:
- Video sync: Every hour (`0 * * * *`)
- Roblox CCU: Every 5 minutes (`*/5 * * * *`)

Vercel will automatically set up these cron jobs. You can also add a `CRON_SECRET` environment variable for additional security.

## Project Structure

```
/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── cron/         # Cron job endpoints
│   │   ├── participants/ # Participant endpoints
│   │   └── admin/        # Admin endpoints
│   ├── admin/            # Admin dashboard
│   ├── join/             # Registration page
│   ├── p/[token]/        # Participant dashboard
│   ├── rules/            # Rules page
│   └── page.tsx          # Main page
├── components/           # React components
│   ├── ui/              # shadcn/ui components
│   └── ...              # Custom components
├── lib/                  # Utility functions
│   ├── api/             # API clients (YouTube, TikTok, Roblox)
│   ├── eligibility.ts  # Eligibility engine
│   ├── robux.ts        # Robux calculations
│   └── db.ts           # Prisma client
└── prisma/             # Database schema
    └── schema.prisma
```

## Key Features Explained

### Eligibility Rules

A video is eligible if it meets ALL of these:
- ✅ Gameplay clip of One Last Stand only
- ✅ At least 15 seconds long
- ✅ Includes hashtag `#trythemoon` (case-insensitive)
- ✅ TikTok: ≥ 5,000 views | YouTube: ≥ 10,000 views
- ✅ Max 3 eligible posts per day per account
- ❌ No insults/hateful/abusive content

### Participant Flow

1. Participant registers at `/join`
2. Provides TikTok handle and/or YouTube channel
3. Receives a unique dashboard token/link
4. System automatically syncs videos hourly
5. Videos are evaluated for eligibility
6. Participant can view their dashboard at `/p/[token]`

### Admin Flow

1. Admin logs in at `/admin` with password
2. Can view all videos and participants
3. Can override eligibility for any video
4. Can export data as CSV
5. Can see total Robux spent/remaining

## API Endpoints

### Public
- `GET /api/leaderboard?platform=tiktok|youtube` - Get leaderboard
- `GET /api/robux` - Get Robux statistics
- `GET /api/roblox-ccu` - Get current CCU
- `POST /api/participants/register` - Register participant
- `GET /api/participants/[token]` - Get participant data

### Admin (Protected)
- `GET /api/admin/videos` - List all videos
- `POST /api/admin/override-eligibility` - Override eligibility
- `POST /api/admin/login` - Admin login

### Cron (Protected)
- `GET /api/cron/sync-videos` - Sync videos from platforms
- `GET /api/cron/roblox-ccu` - Update Roblox CCU

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` and `DIRECT_URL` are correct
- Check Supabase project is active
- Ensure IP is whitelisted in Supabase (if using IP restrictions)

### YouTube API Errors
- Verify API key is valid
- Check API quota limits
- Ensure YouTube Data API v3 is enabled

### TikTok API Not Working
- TikTok API requires OAuth setup
- System will fall back to manual submission mode
- See `lib/api/tiktok.ts` for implementation details

### Cron Jobs Not Running
- Verify `vercel.json` is in root directory
- Check Vercel cron job configuration in dashboard
- Add `CRON_SECRET` for security

## License

This project is for a one-time event. Use as needed.

## Support

For issues or questions, check the code comments or refer to the implementation plan.

