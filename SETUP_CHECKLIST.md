# Setup Checklist

## ✅ Completed
- [x] Project initialized with Next.js, TypeScript, TailwindCSS
- [x] Dependencies installed
- [x] Prisma client generated
- [x] All code files created

## 📋 Next Steps (Do These Now)

### 1. Create Environment Variables File
Create a `.env` file in the root directory with these variables:

```env
# Supabase (REQUIRED)
# Get these from Supabase: Project Settings > Database > ORMs tab > Prisma
# DATABASE_URL: Connection Pooling (port 6543) - for the app
DATABASE_URL="postgresql://postgres.[PROJECT]:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
# DIRECT_URL: Direct Connection (port 5432) - for migrations only
DIRECT_URL="postgresql://postgres.[PROJECT]:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"

# Admin (REQUIRED)
ADMIN_PASSWORD=choose-a-secure-password

# App URL (REQUIRED for local)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# YouTube API (REQUIRED for video syncing)
YOUTUBE_API_KEY=your-youtube-api-key

# Optional
ROBLOX_PLACE_ID=your-roblox-place-id
TIKTOK_CLIENT_KEY=optional
TIKTOK_CLIENT_SECRET=optional
CRON_SECRET=optional-random-string
```

### 2. Set Up Supabase Database
1. Go to https://supabase.com → Create/Select Project
2. Project Settings → Database → Copy connection string
3. Replace `[PASSWORD]` with your database password
4. Add to `.env` as `DATABASE_URL` and `DIRECT_URL`

### 3. Get YouTube API Key
1. Go to https://console.cloud.google.com
2. Create project → Enable "YouTube Data API v3"
3. Create API Key → Add to `.env` as `YOUTUBE_API_KEY`

### 4. Push Database Schema
```bash
npm run db:push
```

### 5. Start Development Server
```bash
npm run dev
```

### 6. Test
- Visit http://localhost:3000
- Try registering at http://localhost:3000/join
- Test admin at http://localhost:3000/admin

## 🚀 Deployment (After Local Testing)

1. Push code to GitHub
2. Import to Vercel
3. Add all environment variables in Vercel dashboard
4. Deploy!

---

**Need help?** See `SETUP.md` for detailed instructions.

