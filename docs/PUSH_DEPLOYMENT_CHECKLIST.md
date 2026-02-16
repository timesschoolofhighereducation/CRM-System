# 🚀 Push Notifications Deployment Checklist

Quick reference for deploying push notifications to production.

---

## ⚡ Quick Setup (5 minutes)

### Step 1: Generate VAPID Keys (One-time)

```bash
npx web-push generate-vapid-keys
```

**Save both keys securely!** You'll need them for all environments.

---

### Step 2: Development Setup

Add to `.env`:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY="BJ_xF7Io7_kNbMOhxXZtS5yQp1yTCccSLznVaJJrYg..."
VAPID_PRIVATE_KEY="GpGfStk41C_skuP21yx4oHwm__c4TLyLVe5a4j-gQb0"
VAPID_SUBJECT="mailto:admin@yourdomain.com"
```

**Restart dev server:**
```bash
npm run dev
```

---

### Step 3: Production Setup (Vercel)

📖 **Detailed Visual Guide:** See [VERCEL_ENV_SETUP_GUIDE.md](./VERCEL_ENV_SETUP_GUIDE.md) for step-by-step instructions with screenshots.

#### Option A: Vercel Dashboard (Easiest)

1. Go to: **Settings → Environment Variables**
2. Add these 3 variables (all environments):

| Variable | Value | Scope |
|----------|-------|-------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Your public key | All |
| `VAPID_PRIVATE_KEY` | Your private key | All |
| `VAPID_SUBJECT` | `mailto:admin@yourdomain.com` | All |

3. **Redeploy** (automatic or manual)

#### Option B: Vercel CLI

```bash
vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY
vercel env add VAPID_PRIVATE_KEY
vercel env add VAPID_SUBJECT

vercel --prod
```

---

## ✅ Verification Steps

### Development

- [ ] `.env` file has all 3 VAPID variables
- [ ] Dev server restarted
- [ ] Visit: `http://localhost:3000/api/push/vapid-public-key`
  - Should return: `{"publicKey":"BJ_xF7Io..."}`
- [ ] Click "Enable Push Notifications" in app
- [ ] Browser prompts for permission
- [ ] Console shows: "Service Worker registered"
- [ ] Test notification received

### Production

- [ ] Environment variables added to Vercel dashboard
- [ ] App redeployed successfully
- [ ] Visit: `https://yourdomain.com/api/push/vapid-public-key`
  - Should return: `{"publicKey":"BJ_xF7Io..."}`
  - If error → Environment variables not loaded
- [ ] Open site and enable push notifications
- [ ] Subscription saved to database
- [ ] Test notification received (even when tab closed)
- [ ] Notification click opens correct page

---

## 🔧 Troubleshooting

### "Failed to enable push"

**Cause:** VAPID keys not configured

**Fix:**
```bash
# 1. Check .env file has keys
cat .env | grep VAPID

# 2. Restart dev server
npm run dev

# 3. Verify API endpoint
curl http://localhost:3000/api/push/vapid-public-key
```

### Production: "VAPID public key not configured"

**Cause:** Environment variables not set in Vercel

**Fix:**
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Verify all 3 VAPID variables exist
3. Check they're enabled for "Production" environment
4. Redeploy: Deployments → ... → Redeploy

### Service worker not registering

**Cause:** Browser cache or HTTPS issue

**Fix:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard reload (Ctrl+Shift+R)
3. Check DevTools → Application → Service Workers
4. Verify `sw.js` file exists in `public/` folder
5. Production requires HTTPS (Vercel handles this)

### Permission denied

**Cause:** User blocked notifications

**Fix:**
1. Chrome: Click 🔒 in address bar → Site Settings → Notifications → Allow
2. Firefox: Click 🔒 → Permissions → Notifications → Allow
3. Safari: Safari → Settings → Websites → Notifications → Allow
4. Test in incognito/private window

---

## 📊 Database Check

Verify subscriptions are saved:

```bash
# Connect to database
npx prisma studio

# Or query directly
npx prisma db execute --stdin <<EOF
SELECT * FROM push_subscriptions LIMIT 10;
EOF
```

Expected columns:
- `id`, `userId`, `endpoint`, `keys`, `isActive`, `createdAt`, `updatedAt`

---

## 🔐 Security Checklist

- [ ] `VAPID_PRIVATE_KEY` never committed to git
- [ ] `.env` file in `.gitignore`
- [ ] Production uses HTTPS (required for service workers)
- [ ] Database connection uses SSL (`?sslmode=require`)
- [ ] Push subscriptions scoped to authenticated users only

---

## 📱 Browser Support

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome 50+ | ✅ | Fully supported |
| Firefox 44+ | ✅ | Fully supported |
| Edge 79+ | ✅ | Fully supported |
| Safari 16+ | ✅ | Requires iOS 16.4+ or macOS 13+ |
| Opera 37+ | ✅ | Fully supported |

---

## 🆘 Still Not Working?

1. **Check browser console** (F12 → Console)
   - Look for red error messages
   - Check Network tab for failed API calls

2. **Check service worker** (F12 → Application → Service Workers)
   - Should show "activated and is running"
   - If "waiting" → Close all tabs and reopen

3. **Check API endpoint**
   ```bash
   # Development
   curl http://localhost:3000/api/push/vapid-public-key
   
   # Production
   curl https://yourdomain.com/api/push/vapid-public-key
   ```

4. **Check server logs**
   - Vercel: Dashboard → Deployments → Click deployment → Runtime Logs
   - Look for errors related to push notifications

5. **Verify database schema**
   ```bash
   npx prisma migrate status
   npx prisma generate
   ```

---

## 📖 Full Documentation

For detailed explanation and advanced configuration:
- [PUSH_NOTIFICATIONS_SETUP.md](./PUSH_NOTIFICATIONS_SETUP.md) - Complete setup guide
- [NOTIFICATIONS_AND_SECURITY.md](./NOTIFICATIONS_AND_SECURITY.md) - Architecture & security

---

## 🎯 Quick Test

After setup, run this test flow:

1. Open app in browser
2. Open DevTools (F12) → Console
3. Navigate to notifications settings
4. Click "Enable Push Notifications"
5. Grant permission in browser prompt
6. Check console: Should see "Service Worker registered"
7. Trigger a notification in your app
8. Should receive browser notification (even if tab is closed)
9. Click notification → Should open app at correct URL

**Success!** 🎉 Push notifications are working!

---

*Last updated: February 16, 2026*
