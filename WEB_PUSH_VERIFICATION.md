# 🔔 Web Push Notification Verification Guide

This guide helps you verify if web push notifications are working correctly.

## ✅ Quick Checklist

### 1. **VAPID Keys Configuration**
Check if VAPID keys are set in your environment:

```bash
# Check if keys exist
echo $NEXT_PUBLIC_VAPID_PUBLIC_KEY
echo $VAPID_PRIVATE_KEY
echo $VAPID_SUBJECT
```

**If not set:**
1. Generate VAPID keys:
   ```bash
   npm run generate:vapid-keys
   ```

2. Add to your `.env` file:
   ```env
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key-here
   VAPID_PRIVATE_KEY=your-private-key-here
   VAPID_SUBJECT=mailto:your-email@example.com
   ```

3. Restart your server

### 2. **Database Migration**
Ensure the PushSubscription table exists:

```bash
# Check if migration is needed
npx prisma db push

# Or run migrations
npx prisma migrate dev
```

### 3. **Service Worker Registration**
1. Open your app in the browser
2. Open DevTools (F12)
3. Go to **Application** tab → **Service Workers**
4. Check if `/sw.js` is registered and active

### 4. **Test Push Subscription**

#### Step 1: Check Browser Support
Open browser console and run:
```javascript
console.log('Service Worker:', 'serviceWorker' in navigator)
console.log('Push Manager:', 'PushManager' in window)
console.log('Notifications:', 'Notification' in window)
```

All should return `true`.

#### Step 2: Test VAPID Public Key Endpoint
```bash
curl http://localhost:3000/api/push/vapid-public-key
```

Should return:
```json
{"publicKey":"BHx..."}
```

#### Step 3: Enable Push Notifications in UI
1. Look for the bell icon next to the notification bell in the sidebar
2. Click it to enable push notifications
3. Grant permission when browser prompts
4. Icon should turn green (🔔) when enabled

#### Step 4: Verify Subscription
Check browser console for:
- "Service Worker registered successfully"
- "Subscribed to push notifications"

Check database:
```sql
SELECT * FROM push_subscriptions WHERE "isActive" = true;
```

### 5. **Test Sending Push Notification**

Create a test notification via API or when a real notification is created:

```typescript
// This happens automatically when createNotification() is called
// But you can test manually:

import { sendPushNotification } from '@/lib/push-notification-service'

await sendPushNotification(userId, {
  title: 'Test Notification',
  body: 'This is a test push notification',
  url: '/dashboard'
})
```

## 🔍 Troubleshooting

### Issue: "Push notifications not supported"
**Solution:**
- Ensure you're using HTTPS (required for push notifications)
- Local development: Use `https://localhost:3000` or a tunneling service
- Check browser compatibility (Chrome, Firefox, Edge, Safari 16.4+)

### Issue: "VAPID public key not configured"
**Solution:**
- Check `.env` file has `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- Restart server after adding keys
- Verify key is returned from `/api/push/vapid-public-key`

### Issue: "Service Worker not registering"
**Solution:**
- Check `public/sw.js` exists
- Verify Next.js config allows service worker
- Check browser console for errors
- Ensure HTTPS is enabled

### Issue: "Permission denied"
**Solution:**
- User must click "Allow" when browser prompts
- If previously denied, reset in browser settings:
  - Chrome: Settings → Privacy → Site Settings → Notifications
  - Firefox: Settings → Privacy → Permissions → Notifications
  - Safari: Preferences → Websites → Notifications

### Issue: "Subscription failed"
**Solution:**
- Check VAPID keys are correct
- Verify service worker is active
- Check browser console for specific errors
- Ensure database migration ran successfully

## 🧪 Manual Testing Steps

1. **Start the app:**
   ```bash
   npm run dev
   ```

2. **Open in browser:**
   - Navigate to your app
   - Open DevTools (F12)

3. **Check service worker:**
   - Application tab → Service Workers
   - Should see `/sw.js` registered

4. **Enable push:**
   - Click the bell icon next to notifications
   - Grant permission
   - Check icon turns green

5. **Test notification:**
   - Create a post that triggers a notification
   - Or manually trigger via API
   - Should see browser notification appear

6. **Verify in database:**
   ```sql
   SELECT id, "userId", endpoint, "isActive", "createdAt" 
   FROM push_subscriptions;
   ```

## 📊 Status Check Endpoints

### Check VAPID Key:
```bash
GET /api/push/vapid-public-key
```

### Check Subscription (via browser console):
```javascript
navigator.serviceWorker.ready.then(reg => {
  reg.pushManager.getSubscription().then(sub => {
    console.log('Subscription:', sub ? 'Active' : 'None')
  })
})
```

## ✅ Success Indicators

- ✅ Service worker registered in DevTools
- ✅ Push subscription saved in database
- ✅ Bell icon shows green when enabled
- ✅ Browser notifications appear when triggered
- ✅ Notifications work even when tab is closed (desktop)
- ✅ Clicking notification opens the app

## 🚨 Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "web-push not available" | Package not installed | `npm install web-push` |
| "VAPID keys not configured" | Missing env vars | Add keys to `.env` |
| "Service worker registration failed" | HTTPS not enabled | Use HTTPS or localhost |
| "Permission denied" | User blocked notifications | Reset in browser settings |
| "Subscription failed" | Invalid VAPID key | Regenerate and update keys |

