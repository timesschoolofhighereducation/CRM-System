# 🔔 Web Push Notifications Setup Guide

This guide will help you set up web push notifications that work across all browsers (Chrome, Firefox, Safari, Edge) on both desktop and mobile devices.

## ✅ What's Implemented

- ✅ Service Worker for handling push events
- ✅ Push subscription management (subscribe/unsubscribe)
- ✅ Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- ✅ Mobile and desktop support
- ✅ Automatic push notification sending when notifications are created
- ✅ UI toggle button to enable/disable push notifications

## 📋 Prerequisites

1. HTTPS enabled (required for push notifications)
   - Local development: Use `https://localhost:3000` or a tunneling service like ngrok
   - Production: Ensure your domain has SSL certificate
   - **Vercel**: HTTPS is automatically provided ✅

2. Generate VAPID keys

## 🚀 Vercel Deployment

If deploying to Vercel, see `VERCEL_PUSH_NOTIFICATIONS_SETUP.md` for Vercel-specific instructions.

**Quick Vercel Setup:**
1. Generate keys: `npm run generate:vapid-keys`
2. Add to Vercel: Settings → Environment Variables
3. Deploy - that's it!

## 🚀 Setup Steps

### Step 1: Generate VAPID Keys

Run the following command to generate VAPID keys:

```bash
npm run generate:vapid-keys
```

This will output something like:

```
✅ VAPID Keys Generated Successfully!

Add these to your .env file:

NEXT_PUBLIC_VAPID_PUBLIC_KEY=BHx...
VAPID_PRIVATE_KEY=xyz...
VAPID_SUBJECT=mailto:admin@example.com
```

### Step 2: Add to Environment Variables

Add the generated keys to your `.env` file:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key-here
VAPID_PRIVATE_KEY=your-private-key-here
VAPID_SUBJECT=mailto:your-email@example.com
```

**Important:** 
- The public key can be exposed (starts with `NEXT_PUBLIC_`)
- The private key must be kept secret (never commit to git)
- The subject should be a `mailto:` URL (your contact email)

### Step 3: Run Database Migration

The push notification system requires a new database table. Run:

```bash
npx prisma generate
npx prisma db push
```

Or if using migrations:

```bash
npx prisma migrate dev --name add_push_subscriptions
```

### Step 4: Restart Your Server

Restart your development or production server to load the new environment variables.

## 📱 How It Works

### For Users

1. **Enable Push Notifications:**
   - Click the bell icon next to the notification bell in the sidebar
   - Click "Enable push notifications" (green bell icon)
   - Grant permission when prompted by the browser

2. **Receive Notifications:**
   - When a notification is created in the system, users with push enabled will receive a browser notification
   - Notifications appear even when the browser tab is closed (on desktop)
   - Clicking a notification opens the app and navigates to the relevant page

3. **Disable Push Notifications:**
   - Click the bell icon again (now showing as green)
   - Click to disable

### Browser Support

| Browser | Desktop | Mobile | Notes |
|---------|---------|--------|-------|
| Chrome  | ✅      | ✅     | Full support |
| Firefox | ✅      | ✅     | Full support |
| Edge    | ✅      | ✅     | Full support |
| Safari  | ✅      | ⚠️     | Requires macOS 16+ / iOS 16.4+ |

### Mobile Specific Notes

- **iOS Safari:** Requires iOS 16.4+ and user must add the site to home screen
- **Android Chrome:** Full support out of the box
- **Mobile Firefox:** Full support

## 🔧 Technical Details

### Service Worker

Located at: `public/sw.js`

Handles:
- Push event reception
- Notification display
- Click handling
- Background sync

### API Endpoints

- `POST /api/push/subscribe` - Subscribe user to push notifications
- `DELETE /api/push/unsubscribe` - Unsubscribe user
- `GET /api/push/vapid-public-key` - Get public key for client

### Database Schema

New `PushSubscription` model stores:
- User ID
- Push endpoint URL
- Encryption keys (p256dh, auth)
- Device information
- Subscription status

### Integration

Push notifications are automatically sent when:
- A notification is created via `createNotification()` function
- The user has an active push subscription
- VAPID keys are configured

## 🐛 Troubleshooting

### Push Notifications Not Working?

1. **Check HTTPS:**
   - Push notifications require HTTPS (except localhost in development)
   - Verify your site is accessible via `https://`

2. **Check VAPID Keys:**
   - Ensure keys are set in `.env`
   - Restart server after adding keys
   - Verify public key matches what's returned from `/api/push/vapid-public-key`

3. **Check Browser Console:**
   - Look for errors in browser console
   - Check service worker registration status
   - Verify permission is granted

4. **Check Service Worker:**
   - Open DevTools > Application > Service Workers
   - Verify service worker is registered and active
   - Check for errors in service worker console

5. **Check Database:**
   - Verify `PushSubscription` table exists
   - Check if subscription is saved: `SELECT * FROM push_subscriptions WHERE userId = '...'`

### Common Issues

**"Push subscription failed"**
- User denied permission
- VAPID keys not configured
- Service worker not registered

**"Notifications not appearing"**
- Browser notifications disabled at OS level
- User blocked notifications for your site
- Service worker not running

**"Invalid subscription"**
- Subscription endpoint expired
- User uninstalled app/browser
- Subscription was manually revoked

## 📝 Testing

### Test Push Notification

1. Enable push notifications in the UI
2. Create a notification (e.g., approve a post)
3. Check if browser notification appears
4. Test on different browsers/devices

### Manual Test Script

You can manually trigger a push notification by calling the notification service:

```typescript
import { sendPushNotification } from '@/lib/push-notification-service'

await sendPushNotification(userId, {
  title: 'Test Notification',
  body: 'This is a test push notification',
  url: '/dashboard'
})
```

## 🔒 Security

- Private key is never exposed to clients
- Subscriptions are user-specific and validated
- Invalid subscriptions are automatically cleaned up
- All communication uses HTTPS

## 📚 Additional Resources

- [Web Push Protocol](https://web.dev/push-notifications-overview/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)

