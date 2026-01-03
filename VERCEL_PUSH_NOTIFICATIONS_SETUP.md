# 🔔 Web Push Notifications - Vercel Setup Guide

This guide will help you configure web push notifications to work with Vercel deployment.

## ✅ Prerequisites

- Vercel account and project
- HTTPS enabled (Vercel provides this automatically)
- Database with PushSubscription table (run migrations)

## 🚀 Setup Steps

### Step 1: Generate VAPID Keys

Run this command locally to generate VAPID keys:

```bash
npm run generate:vapid-keys
```

This will output:
```
✅ VAPID Keys Generated Successfully!

Add these to your .env file:

NEXT_PUBLIC_VAPID_PUBLIC_KEY=BHx...
VAPID_PRIVATE_KEY=xyz...
VAPID_SUBJECT=mailto:admin@example.com
```

### Step 2: Add Environment Variables to Vercel

1. **Go to Vercel Dashboard**
   - Navigate to your project
   - Go to **Settings** → **Environment Variables**

2. **Add the following variables:**

   **For Production:**
   ```
   NEXT_PUBLIC_VAPID_PUBLIC_KEY = <your-public-key>
   VAPID_PRIVATE_KEY = <your-private-key>
   VAPID_SUBJECT = mailto:your-email@example.com
   NEXT_PUBLIC_APP_EMAIL = your-email@example.com
   ```

   **For Preview/Development (optional):**
   - You can add the same variables for Preview and Development environments
   - Or use different keys for testing

3. **Important Notes:**
   - ✅ `NEXT_PUBLIC_VAPID_PUBLIC_KEY` - Must have `NEXT_PUBLIC_` prefix (exposed to client)
   - 🔒 `VAPID_PRIVATE_KEY` - Keep secret (never exposed to client)
   - ✅ `VAPID_SUBJECT` - Should be a `mailto:` URL (your contact email)
   - ✅ `NEXT_PUBLIC_APP_EMAIL` - Your app email (used as fallback)

### Step 3: Deploy to Vercel

1. **Push your code to GitHub** (if not already):
   ```bash
   git add .
   git commit -m "Add web push notifications"
   git push origin main
   ```

2. **Vercel will automatically:**
   - Detect the push
   - Run the build
   - Deploy with new environment variables

3. **Verify deployment:**
   - Check build logs for any errors
   - Ensure environment variables are loaded

### Step 4: Run Database Migration

If you haven't already, run the database migration to create the `PushSubscription` table:

**Option A: Via Vercel CLI (Recommended)**
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Link to your project
vercel link

# Run migration
vercel env pull .env.local
npx prisma generate
npx prisma migrate deploy
```

**Option B: Via Vercel Dashboard**
1. Go to your project settings
2. Add a build command that includes migrations:
   ```
   npx prisma generate && npx prisma migrate deploy && npm run build
   ```

**Option C: Manual Migration Script**
Create a one-time migration script and run it via Vercel Functions or manually connect to your database.

### Step 5: Test Push Notifications

1. **Visit your deployed site** (must be HTTPS)
2. **Enable push notifications:**
   - Click the bell icon next to the notification bell
   - Grant permission when prompted
   - Icon should turn green

3. **Test receiving notifications:**
   - Create a notification (e.g., approve a post)
   - You should receive a browser notification
   - Works even when the tab is closed

## 🔧 Vercel-Specific Configuration

### Service Worker

The service worker (`public/sw.js`) is automatically served by Vercel. No additional configuration needed.

### Environment Variables

Vercel automatically injects environment variables:
- Variables with `NEXT_PUBLIC_` prefix are available to client-side code
- Other variables are only available server-side
- Variables are encrypted and secure

### Build Configuration

Your `next.config.ts` already includes service worker headers. No changes needed.

## 🐛 Troubleshooting

### Push Notifications Not Working on Vercel?

1. **Check Environment Variables:**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Verify all VAPID keys are set
   - Ensure `NEXT_PUBLIC_VAPID_PUBLIC_KEY` has the `NEXT_PUBLIC_` prefix

2. **Check Build Logs:**
   - Go to Vercel Dashboard → Deployments
   - Click on latest deployment
   - Check for any errors related to push notifications

3. **Verify HTTPS:**
   - Vercel provides HTTPS automatically
   - Ensure you're accessing via `https://` (not `http://`)
   - Push notifications require HTTPS

4. **Check Browser Console:**
   - Open DevTools → Console
   - Look for service worker registration errors
   - Check for VAPID key errors

5. **Verify Database:**
   - Ensure `PushSubscription` table exists
   - Check if subscriptions are being saved
   - Verify database connection in Vercel

6. **Test API Endpoint:**
   - Visit: `https://your-domain.vercel.app/api/push/vapid-public-key`
   - Should return: `{"publicKey":"..."}`
   - If it returns an error, VAPID keys are not configured

### Common Issues

**"VAPID public key not configured"**
- Solution: Add `NEXT_PUBLIC_VAPID_PUBLIC_KEY` to Vercel environment variables

**"Service worker registration failed"**
- Solution: Ensure you're using HTTPS (Vercel provides this automatically)

**"Push subscription failed"**
- Solution: Check browser console for specific error messages
- Verify VAPID keys are correct
- Ensure user granted notification permission

**"Notifications not appearing"**
- Solution: Check browser notification settings
- Verify service worker is active (DevTools → Application → Service Workers)
- Check if push subscription is saved in database

## 📝 Environment Variables Checklist

Before deploying, ensure these are set in Vercel:

- [ ] `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (with `NEXT_PUBLIC_` prefix)
- [ ] `VAPID_PRIVATE_KEY` (without prefix, server-side only)
- [ ] `VAPID_SUBJECT` (mailto: URL)
- [ ] `NEXT_PUBLIC_APP_EMAIL` (optional, for fallback)
- [ ] `DATABASE_URL` (for storing subscriptions)
- [ ] `JWT_SECRET` (for authentication)

## 🔒 Security Notes

- ✅ Private key is never exposed to clients
- ✅ All communication uses HTTPS (Vercel provides this)
- ✅ Subscriptions are user-specific and validated
- ✅ Invalid subscriptions are automatically cleaned up

## 📚 Additional Resources

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Web Push Protocol](https://web.dev/push-notifications-overview/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

## ✅ Verification Checklist

After setup, verify:

- [ ] VAPID keys are set in Vercel environment variables
- [ ] Database migration completed (PushSubscription table exists)
- [ ] Service worker is registered (check DevTools)
- [ ] Push subscription button appears in UI
- [ ] Can subscribe to push notifications
- [ ] Can receive test notifications
- [ ] Notifications work when tab is closed
- [ ] API endpoint `/api/push/vapid-public-key` returns public key

Once all items are checked, your web push notifications are fully configured for Vercel! 🎉

