# Push Notifications Setup Guide

This guide explains how to set up web push notifications for both development and production environments.

---

## Prerequisites

- Modern browser with Push API support (Chrome, Firefox, Edge, Safari 16+)
- HTTPS connection (required for service workers and push notifications)
- Node.js and npm/yarn installed

---

## 1. Generate VAPID Keys

VAPID (Voluntary Application Server Identification) keys are required for web push notifications. You need to generate a public/private key pair.

### Generate Keys

```bash
npx web-push generate-vapid-keys
```

This will output:
```
Public Key: BJ_xF7Io7...
Private Key: GpGfStk41C...
```

**IMPORTANT:** 
- Generate **ONE set** of keys and use them across all environments (dev, staging, production)
- Keep the **private key** secret - never commit it to version control
- The **public key** can be safely exposed to clients

---

## 2. Development Setup

### Add to `.env` file

```bash
# VAPID Keys for Web Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-public-key-here"
VAPID_PRIVATE_KEY="your-private-key-here"
VAPID_SUBJECT="mailto:admin@yourdomain.com"
```

### Test Locally

1. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. Open your browser to `http://localhost:3000`

3. Navigate to notifications settings or click the notification bell

4. Click "Enable Push Notifications"

5. Grant notification permission when prompted

6. You should see "Push notifications enabled successfully"

### Troubleshooting Development

If you see "Failed to enable push":

1. **Check environment variables are loaded:**
   ```bash
   # Restart your dev server after adding VAPID keys
   # Press Ctrl+C to stop, then run again:
   npm run dev
   ```

2. **Check browser console** for errors:
   - Open DevTools (F12)
   - Look for errors in Console tab
   - Common errors:
     - "VAPID public key not configured" → Environment variables not loaded
     - "Service worker registration failed" → Check `/sw.js` exists in public folder
     - "Notification permission denied" → User blocked notifications (clear in browser settings)

3. **Verify service worker is registered:**
   - DevTools → Application tab → Service Workers
   - Should see `sw.js` registered with status "activated"

4. **Check API endpoint:**
   - Visit: `http://localhost:3000/api/push/vapid-public-key`
   - Should return: `{"publicKey":"BJ_xF7Io7..."}`
   - If error, verify `.env` file has `NEXT_PUBLIC_VAPID_PUBLIC_KEY`

---

## 3. Production Setup (Vercel/Other Platforms)

### Option A: Vercel Deployment

#### Method 1: Using Vercel Dashboard (Recommended)

1. Go to your Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Add the following variables:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Your public key | Production, Preview, Development |
| `VAPID_PRIVATE_KEY` | Your private key | Production, Preview, Development |
| `VAPID_SUBJECT` | `mailto:admin@yourdomain.com` | Production, Preview, Development |

4. Click **Save**
5. Redeploy your application (Vercel will auto-redeploy, or trigger manually)

#### Method 2: Using Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Set environment variables
vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY
# Paste your public key when prompted

vercel env add VAPID_PRIVATE_KEY
# Paste your private key when prompted

vercel env add VAPID_SUBJECT
# Enter: mailto:admin@yourdomain.com

# Redeploy
vercel --prod
```

#### Method 3: Import from File

1. Update the `vercel.env` file in your project with your actual keys:
   ```bash
   NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-public-key-here"
   VAPID_PRIVATE_KEY="your-private-key-here"
   VAPID_SUBJECT="mailto:admin@yourdomain.com"
   ```

2. In Vercel Dashboard:
   - Go to **Settings → Environment Variables**
   - Click **Import** button (top right)
   - Select your `vercel.env` file
   - Click **Import**

**IMPORTANT:** Never commit `vercel.env` with real keys to git!

### Option B: Other Platforms (Netlify, Railway, etc.)

Add the same three environment variables in your platform's dashboard:
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`

---

## 4. Verify Production Setup

### Step 1: Check Environment Variables

Visit: `https://yourdomain.com/api/push/vapid-public-key`

Expected response:
```json
{
  "publicKey": "BJ_xF7Io7_kNbMOhxXZtS5yQp1yTCccSLznVaJJrYg..."
}
```

If you see an error:
```json
{
  "error": "VAPID public key not configured"
}
```
→ Environment variables not set or deployment not complete

### Step 2: Test Push Subscription

1. Open your production site: `https://yourdomain.com`
2. Open browser DevTools (F12) → Console tab
3. Navigate to notification settings
4. Click "Enable Push Notifications"
5. Grant permission when prompted
6. Check console for any errors

### Step 3: Test Push Notification Delivery

Once subscribed, trigger a test notification (e.g., by performing an action that generates a notification in your app):
- You should receive a browser push notification
- It should work even when the tab is in the background or closed

---

## 5. Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 50+ | ✅ Full support |
| Firefox | 44+ | ✅ Full support |
| Edge | 79+ | ✅ Full support |
| Safari | 16+ | ✅ Full support (macOS 13+, iOS 16.4+) |
| Opera | 37+ | ✅ Full support |

**Note:** Safari requires:
- iOS 16.4+ or macOS 13+
- Website added to Home Screen (iOS) or using Safari's native push (macOS)

---

## 6. Security Considerations

### VAPID Private Key Security

✅ **DO:**
- Store VAPID_PRIVATE_KEY in environment variables only
- Use different keys for dev/staging/production (optional but recommended)
- Rotate keys periodically (requires users to re-subscribe)
- Monitor for unauthorized push sends

❌ **DON'T:**
- Commit VAPID_PRIVATE_KEY to version control
- Expose VAPID_PRIVATE_KEY in client-side code
- Share private key with third parties
- Use the same keys across multiple unrelated apps

### User Privacy

- Push subscriptions are tied to authenticated users
- Subscriptions are automatically reassigned if the same device is used by different users
- Users can unsubscribe at any time
- Respect user preferences for notification types

---

## 7. Troubleshooting Production

### Issue: "Failed to enable push"

**Possible causes:**

1. **VAPID keys not configured**
   - Solution: Verify environment variables in platform dashboard
   - Check: Visit `/api/push/vapid-public-key` endpoint

2. **HTTPS not configured**
   - Service workers require HTTPS (except localhost)
   - Solution: Ensure your domain has valid SSL certificate
   - Vercel/Netlify handle this automatically

3. **Service worker not loading**
   - Check: DevTools → Network tab → Look for `sw.js` request
   - Should return 200 status code
   - Solution: Verify `/public/sw.js` exists and is deployed

4. **Browser permission denied**
   - User previously blocked notifications
   - Solution: User must manually enable in browser settings:
     - Chrome: Site Settings → Notifications
     - Firefox: Site Information → Permissions → Notifications
     - Safari: Safari Settings → Websites → Notifications

### Issue: "Push notifications not received"

**Check:**

1. **Subscription saved in database**
   ```sql
   SELECT * FROM PushSubscription WHERE userId = 'user-id';
   ```
   Should show active subscription(s)

2. **Push service reachable**
   - Verify server can reach push endpoints (FCM, Mozilla, Apple)
   - Check firewall rules if self-hosted

3. **Notification permission still granted**
   - User may have revoked permission
   - Check: `Notification.permission` in browser console

4. **Browser/tab open**
   - Some browsers (especially mobile) may delay delivery when battery saver is on
   - Test with device charging and browser in background

### Issue: Database errors when subscribing

**Check database schema:**

```bash
# Run migrations
npx prisma migrate deploy

# Verify PushSubscription table exists
npx prisma db pull
```

---

## 8. Monitoring and Analytics

### Track Push Metrics

Monitor these metrics in your application:

1. **Subscription Rate:** Users subscribed / Total users
2. **Push Delivery Rate:** Notifications sent / Notifications delivered
3. **Click-through Rate:** Notification clicks / Notifications delivered
4. **Unsubscribe Rate:** Unsubscribes / Total subscriptions

### Logging

The application logs push events:
- Service worker registration: `console.log('Service Worker registered')`
- Push subscription: `POST /api/push/subscribe`
- Push send failures: `console.error('Error sending push notification')`

Check server logs in your platform dashboard for push-related errors.

---

## 9. Testing Checklist

### Development Testing

- [ ] VAPID keys generated and added to `.env`
- [ ] Development server restarted
- [ ] `/api/push/vapid-public-key` returns public key
- [ ] Service worker registers successfully
- [ ] Permission prompt appears when clicking "Enable Push"
- [ ] Subscription saved to database
- [ ] Test notification received when triggered

### Production Testing

- [ ] VAPID keys added to production environment variables
- [ ] Application redeployed
- [ ] `/api/push/vapid-public-key` endpoint accessible (HTTPS)
- [ ] Service worker registers on production domain
- [ ] Push subscription works on production
- [ ] Push notifications delivered in background
- [ ] Notification click opens correct URL
- [ ] Works on mobile devices (iOS 16.4+, Android)

---

## 10. Advanced Configuration

### Custom Notification Options

Edit `/public/sw.js` to customize notification appearance:

```javascript
const payload = {
  title: data.title,
  body: data.body,
  icon: data.icon || '/fav.png',
  badge: data.badge || '/fav.png',
  image: data.image, // Large image in notification
  vibrate: [200, 100, 200], // Vibration pattern
  requireInteraction: true, // Don't auto-dismiss
  actions: [ // Action buttons
    { action: 'view', title: 'View' },
    { action: 'dismiss', title: 'Dismiss' }
  ]
};
```

### Notification Actions

Handle action button clicks in service worker:

```javascript
self.addEventListener('notificationclick', (event) => {
  if (event.action === 'view') {
    // Handle "View" button click
  } else if (event.action === 'dismiss') {
    // Handle "Dismiss" button click
  }
});
```

### Subscription Management

Users can manage subscriptions in your app's settings. Each device/browser gets a unique subscription.

To unsubscribe all devices for a user:

```typescript
await prisma.pushSubscription.deleteMany({
  where: { userId: user.id }
});
```

---

## Need Help?

- Check browser console for errors (F12 → Console)
- Check Network tab for API calls (F12 → Network)
- Check Application tab for Service Worker status (F12 → Application → Service Workers)
- Review server logs in your platform dashboard
- Verify database has `PushSubscription` table with user's subscription

For more details, see: [NOTIFICATIONS_AND_SECURITY.md](./NOTIFICATIONS_AND_SECURITY.md)
