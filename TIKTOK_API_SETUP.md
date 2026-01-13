# TikTok API Setup Guide

This guide will help you obtain TikTok API credentials (Client Key and Client Secret) for your `.env` file.

## Step-by-Step Instructions

### Step 1: Register for TikTok Developer Account

1. Go to [TikTok for Developers](https://developers.tiktok.com/)
2. Sign in with your TikTok account
3. Complete the developer registration form to create your developer account

### Step 2: Create a New Application

1. In your developer dashboard, click on **"Manage apps"**
2. Click **"Create App"**
3. Fill in the required details for your application:
   - App name
   - App description
   - Category
   - Website URL
4. **Important**: Specify your Redirect URI(s):
   - For local development: `http://localhost:3000/api/auth/tiktok/callback`
   - For production: `https://yourdomain.com/api/auth/tiktok/callback`
   - Ensure these URIs are absolute and begin with `https` or `http`

### Step 3: Get Your Client Key and Client Secret

1. Once your application is created, navigate to **"App Details"** or **"Basic Information"** section
2. You'll find your **Client Key** (also called App ID) - this is visible immediately
3. To get your **Client Secret**:
   - Look for the "Client Secret" field
   - Click the eye icon (👁️) to reveal it
   - **Important**: Copy this immediately - you may not be able to view it again!

### Step 4: Add Credentials to Your `.env` File

1. Open your `.env` file in the root directory of your project
2. Add or update these lines:

```env
TIKTOK_CLIENT_KEY=your_actual_client_key_here
TIKTOK_CLIENT_SECRET=your_actual_client_secret_here
```

**Example:**
```env
TIKTOK_CLIENT_KEY=aw1234567890abcdef
TIKTOK_CLIENT_SECRET=xyz9876543210fedcba1234567890abcdef
```

### Step 5: Important Notes

⚠️ **Security Warning:**
- Never commit your `.env` file to Git (it's already in `.gitignore`)
- Never share your Client Secret publicly
- Keep these credentials secure

📝 **API Access:**
- TikTok API requires OAuth approval process
- Some APIs may require additional permissions or approval
- The current implementation in `lib/api/tiktok.ts` is a placeholder that will need OAuth flow implementation

🔄 **Fallback Mode:**
- If TikTok API keys are not configured, the system will automatically use manual submission mode
- Participants can still submit video URLs manually through the platform

## Troubleshooting

### "TikTok API credentials not configured" Error
- Verify your `.env` file exists in the root directory
- Check that variable names are exactly: `TIKTOK_CLIENT_KEY` and `TIKTOK_CLIENT_SECRET`
- Ensure there are no extra spaces around the `=` sign
- Restart your development server after updating `.env`

### Can't See Client Secret
- If you've already created the app and can't see the secret, you may need to regenerate it
- Go to App Details → Security → Regenerate Client Secret
- **Warning**: Regenerating will invalidate the old secret

### API Not Working
- The current code in `lib/api/tiktok.ts` shows that the OAuth flow is not yet fully implemented
- The system will fall back to manual submission mode if the API is not available
- You may need to implement the OAuth flow in the `OfficialTikTokProvider` class

## Next Steps

After adding your credentials:
1. Restart your development server (`npm run dev`)
2. The system will automatically detect if TikTok API credentials are available
3. If credentials are present, it will attempt to use the official API
4. If not available or if there's an error, it will fall back to manual submission mode

## Resources

- [TikTok for Developers Documentation](https://developers.tiktok.com/doc/)
- [TikTok OAuth Documentation](https://developers.tiktok.com/doc/login-kit-web/)
- [TikTok Research API](https://developers.tiktok.com/doc/research-api-get-started/)

