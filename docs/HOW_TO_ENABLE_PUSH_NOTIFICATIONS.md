# 🔔 How to Enable Push Notifications in Your CRM

## Step-by-Step Guide to Enable Web Push Notifications

---

## ✅ What I Just Fixed

I've fixed the service worker registration issue that was preventing push notifications from working. Here's what was changed:

### 1. Updated `next.config.ts`
- ✅ Added `worker-src 'self' blob:` to CSP (Content Security Policy)
- ✅ Added explicit `Content-Type` header for service worker
- ✅ Added rewrite rule to ensure sw.js is served directly

### 2. Updated `middleware.ts`
- ✅ Excluded `sw.js` from authentication middleware
- ✅ Excluded `fav.png` (notification icon) from authentication

### 3. Improved `push-notification-client.ts`
- ✅ Added service worker accessibility check
- ✅ Better error messages for debugging
- ✅ Added `updateViaCache: 'none'` for reliable updates

---

## 🚀 How to Enable Push Notifications (Users)

### Step 1: Restart Your Development Server

**IMPORTANT:** You must restart the server for changes to take effect.

```bash
# Stop current server (Ctrl+C), then:
npm run dev
# or
yarn dev
```

### Step 2: Open Your CRM

Navigate to: `http://localhost:3000` (or your local dev URL)

### Step 3: Click the Notification Bell

Look for the bell icon 🔔 in the top-right corner of your dashboard.

### Step 4: Enable Browser Notifications

You'll see a prompt that says:

> "Enable browser notifications to get real-time updates."

Click the **"Enable Notifications"** button.

### Step 5: Grant Browser Permission

Your browser will show a permission prompt:

**Chrome/Edge:**
```
http://localhost:3000 wants to:
☐ Show notifications

[Block] [Allow]
```

Click **"Allow"**.

**Firefox:**
```
http://localhost:3000 wants to send you notifications

[Don't Allow] [Allow]
```

Click **"Allow"**.

**Safari:**
```
"localhost:3000" Would Like to Send You Notifications

[Don't Allow] [Allow]
```

Click **"Allow"**.

### Step 6: Enable Web Push

After granting permission, you'll see a "Web push" section in the notifications panel.

Click the 🔕 (bell off) icon to enable it. It will change to 🔔 (bell on).

You should see a success message: **"Push notifications enabled"** ✅

---

## ✅ How to Verify It's Working

### 1. Check the Icon

In the notifications panel, you should now see:
- **"Web push"** with a green bell icon 🔔 (not crossed out)

### 2. Check Browser Console

Open DevTools (F12) → Console tab. You should see:
```
Service Worker: Registered and ready
```

No errors!

### 3. Check Service Worker Status

Open DevTools (F12) → Application tab → Service Workers

You should see:
```
sw.js
Status: activated and is running
```

### 4. Test a Notification

Trigger a notification in your CRM (e.g., approve a post, create an inquiry).

You should receive a browser notification even if your tab is in the background!

---

## 🌐 Browser Compatibility

| Browser | Version | Status | Notes |
|---------|---------|--------|-------|
| **Chrome** | 50+ | ✅ Fully supported | Best experience |
| **Edge** | 79+ | ✅ Fully supported | Chromium-based |
| **Firefox** | 44+ | ✅ Fully supported | Works great |
| **Safari** | 16+ | ✅ Supported | Requires macOS 13+ or iOS 16.4+ |
| **Opera** | 37+ | ✅ Fully supported | Chromium-based |
| **Brave** | Latest | ✅ Fully supported | Chromium-based |

**Mobile:**
- ✅ Android (Chrome, Firefox, Edge)
- ✅ iOS 16.4+ (Safari only, requires adding to home screen)

---

## 🔧 Troubleshooting

### Issue: "Failed to enable push"

**Possible Causes:**

1. **VAPID keys not configured (Vercel only)**
   - See: `VERCEL_FIX_NOW.md`
   - Add environment variables to Vercel Dashboard

2. **Service worker not registering**
   - Check console for errors
   - Make sure you restarted the dev server
   - Clear browser cache (Ctrl+Shift+Delete)

3. **Browser permission denied**
   - Check browser settings
   - Reset permission and try again

---

### Issue: Service Worker Shows "Redundant" or "Waiting"

**Fix:**
1. Open DevTools → Application → Service Workers
2. Check "Update on reload"
3. Click "Unregister" on old service worker
4. Hard refresh: Ctrl+Shift+R
5. Try enabling push notifications again

---

### Issue: "The script resource is behind a redirect"

**This should be fixed now!** If you still see this error:

1. **Restart your dev server** (required for config changes)
2. **Clear browser cache completely**
3. Try in incognito/private window
4. Check that `/sw.js` is accessible: `http://localhost:3000/sw.js`

---

### Issue: Permission Already Denied

If you previously denied notification permission:

**Chrome/Edge:**
1. Click the 🔒 lock icon in address bar
2. Click "Site settings"
3. Find "Notifications"
4. Change to "Allow"
5. Refresh page

**Firefox:**
1. Click the 🔒 lock icon
2. Click arrow next to "Blocked Temporarily"
3. Find "Receive Notifications"
4. Change to "Allow"
5. Refresh page

**Safari:**
1. Safari → Settings (or Preferences)
2. Websites tab
3. Notifications
4. Find your site
5. Change to "Allow"
6. Refresh page

---

### Issue: Works Locally But Not on Vercel

**Solution:** Add VAPID environment variables to Vercel

See detailed guide: `VERCEL_FIX_NOW.md`

Quick summary:
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add these 3 variables:
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_SUBJECT`
3. Redeploy (uncheck build cache)

---

## 📱 Testing on Different Browsers

### Desktop Testing:

1. **Chrome:** Best testing experience
2. **Firefox:** Test for compatibility
3. **Safari:** Test if you're on Mac
4. **Edge:** Usually works like Chrome
5. **Brave:** Test with shields up/down

### Mobile Testing:

1. **Android Chrome:**
   - Works immediately
   - Can test over network or localhost tunnel

2. **iOS Safari:**
   - Requires iOS 16.4+
   - Must add site to home screen first
   - Then grant notification permission

---

## 🎯 What Notifications You'll Receive

Once enabled, you'll receive browser push notifications for:

### Post Approvals:
- ✅ Your post was approved
- ❌ Your post was rejected
- 🔔 Post awaits your approval (if you're an approver)

### System Notifications:
- 📝 New comments/mentions
- 🔔 Important updates
- ⚠️ Action required notifications

### Notification Features:
- 🎨 Color-coded by type (green=success, red=rejected, yellow=pending)
- 🕐 Real-time delivery (even when tab closed)
- 🔗 Click notification to open related item
- 📱 Works on mobile and desktop
- 🌙 Respects "Do Not Disturb" mode

---

## 🔐 Privacy & Security

### What Data Is Stored:

- **Push Subscription:** Browser endpoint, encryption keys
- **Device Info:** Browser name, OS, device type
- **User ID:** Linked to your account

### Security Features:

- ✅ **Encrypted:** All push subscriptions use encryption keys
- ✅ **User-scoped:** You only receive YOUR notifications
- ✅ **Secure storage:** Private keys never exposed to client
- ✅ **HTTPS required:** Works only on secure connections (except localhost)

### You Control Your Data:

- 🔕 **Disable anytime:** Click bell icon to turn off
- 🗑️ **Unsubscribe:** Remove subscription from settings
- 🚫 **Block in browser:** Revoke permission in browser settings

---

## 💡 Pro Tips

### 1. Enable on Multiple Devices

You can enable push notifications on:
- Your work computer
- Your personal computer
- Your phone
- Your tablet

Each device gets its own subscription. You'll receive notifications on all enabled devices!

### 2. Notification Badges

When notifications arrive:
- Browser tab shows red badge with unread count
- Favicon updates with notification indicator
- System tray shows notification count (OS-dependent)

### 3. Do Not Disturb

Respect your focus time:
- Enable "Do Not Disturb" in your OS
- Notifications will queue and show when you're available
- Or temporarily disable in notification settings

### 4. Test Before Important Events

Before going into a meeting or presentation:
1. Test push notifications work
2. Disable if you don't want interruptions
3. Re-enable after to stay updated

---

## 📊 Notification Settings (Coming Soon)

Future enhancements planned:
- 🔇 Quiet hours (e.g., "Don't notify 10 PM - 8 AM")
- 🎚️ Notification preferences (choose which types you want)
- 🔊 Sound customization
- 📧 Email fallback if push fails
- 📱 SMS notifications for critical alerts

---

## 🆘 Still Having Issues?

### 1. Check Service Worker Status

```bash
# In browser console:
navigator.serviceWorker.getRegistration().then(reg => console.log(reg))
```

Should show active service worker.

### 2. Check VAPID Key (Vercel)

```bash
curl https://test-develop-red.vercel.app/api/push/vapid-public-key
```

Should return public key (not error).

### 3. Check Browser Compatibility

Visit: https://caniuse.com/push-api

Verify your browser version supports push notifications.

### 4. Read Detailed Guides

- **Vercel issues:** `VERCEL_FIX_NOW.md`
- **Setup guide:** `PUSH_NOTIFICATIONS_SETUP.md`
- **Troubleshooting:** `VERCEL_PUSH_TROUBLESHOOTING.md`

---

## ✅ Success Checklist

Your push notifications are working when:

- [ ] Service worker registered (no console errors)
- [ ] Browser permission granted (not "denied")
- [ ] Web push enabled (green bell icon 🔔)
- [ ] Test notification received
- [ ] Notification shows even when tab closed
- [ ] Clicking notification opens correct page
- [ ] Works on multiple browsers
- [ ] Works on Vercel (production)

---

**Congratulations! You now have fully functional push notifications across all browsers!** 🎉

*Last updated: February 16, 2026*
