# Supabase + Prisma Setup Guide

This guide shows you exactly how to set up Supabase with Prisma using the ORMs interface.

## Quick Steps

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Click **Project Settings** (gear icon)
   - Click **Database** in the left sidebar

2. **Open ORMs Tab**
   - Click the **"ORMs"** tab (not "Connection String")
   - Select **"Prisma"** from the dropdown

3. **Copy Connection Strings**
   - You'll see two files: `.env.local` and `prisma/schema.prisma`
   - The `.env.local` tab shows your connection strings

4. **Copy DATABASE_URL**
   - This is the connection pooling URL (port 6543)
   - It looks like:
     ```
     postgresql://postgres.gtsxtqluqkojqbltgakr:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
     ```
   - Copy the entire string

5. **Copy DIRECT_URL**
   - This is the direct connection URL (port 5432)
   - It looks like:
     ```
     postgresql://postgres.gtsxtqluqkojqbltgakr:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
     ```
   - Copy the entire string

6. **Replace [YOUR-PASSWORD]**
   - In both strings, replace `[YOUR-PASSWORD]` with your actual Supabase database password
   - This is the password you set when creating the project

7. **Add to .env file**
   - Create a `.env` file in your project root
   - Add both strings:
     ```env
     DATABASE_URL="postgresql://postgres.gtsxtqluqkojqbltgakr:YOUR-ACTUAL-PASSWORD@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
     DIRECT_URL="postgresql://postgres.gtsxtqluqkojqbltgakr:YOUR-ACTUAL-PASSWORD@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
     ```

8. **Verify Prisma Schema**
   - Your `prisma/schema.prisma` should already have:
     ```prisma
     datasource db {
       provider = "postgresql"
       url      = env("DATABASE_URL")
       directUrl = env("DIRECT_URL")
     }
     ```
   - ✅ This is already configured correctly!

9. **Push Schema**
   - Run: `npm run db:push`
   - This will create all tables in your database

## Why Two Connection Strings?

- **DATABASE_URL** (port 6543): Uses connection pooling (PgBouncer) - optimized for serverless/server apps that make many connections
- **DIRECT_URL** (port 5432): Direct database connection - required for Prisma migrations which need direct access

## Troubleshooting

### "Can't reach database server" Error

If you get this error when running `npm run db:push`:

1. **Check your password**: Make sure you replaced `[YOUR-PASSWORD]` with your actual password
2. **Check the URLs**: Verify both URLs are correct and match what Supabase shows
3. **Check project status**: Ensure your Supabase project is active and not paused
4. **Try the direct connection**: Test if `DIRECT_URL` works by temporarily using it for both

### Connection Pooling Issues

- If you get connection limit errors, make sure you're using the pooled connection (port 6543) for `DATABASE_URL`
- The direct connection (port 5432) should only be used for migrations

## Next Steps

After setting up the database:

1. Add other environment variables to `.env`:
   - `ADMIN_PASSWORD`
   - `YOUTUBE_API_KEY`
   - `NEXT_PUBLIC_APP_URL`
   - etc.

2. Run `npm run db:push` to create tables

3. Run `npm run dev` to start the app

