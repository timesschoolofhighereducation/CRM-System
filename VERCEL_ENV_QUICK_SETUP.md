# ⚡ Quick Setup: Web Push Notifications for Vercel

## 🚀 3-Step Setup

### Step 1: Generate VAPID Keys
```bash
npm run generate:vapid-keys
```

### Step 2: Add to Vercel Environment Variables

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these 3 variables:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | (from step 1) | Production, Preview, Development |
| `VAPID_PRIVATE_KEY` | (from step 1) | Production, Preview, Development |
| `VAPID_SUBJECT` | `mailto:your-email@example.com` | Production, Preview, Development |

**Important:**
- ✅ `NEXT_PUBLIC_VAPID_PUBLIC_KEY` MUST have `NEXT_PUBLIC_` prefix
- 🔒 `VAPID_PRIVATE_KEY` should NOT have `NEXT_PUBLIC_` prefix
- 📧 `VAPID_SUBJECT` should be a `mailto:` URL

### Step 3: Deploy

1. Push your code (if you made changes)
2. Vercel will automatically redeploy
3. Visit your site and test push notifications

## ✅ Verify It's Working

1. Visit: `https://your-domain.vercel.app/api/push/vapid-public-key`
   - Should return: `{"publicKey":"..."}`
   - If error: Keys not configured correctly

2. Check browser console:
   - Open DevTools → Console
   - Look for service worker registration
   - No errors = good!

3. Test subscription:
   - Click the bell icon next to notification bell
   - Grant permission
   - Icon should turn green

## 🐛 Quick Troubleshooting

**"VAPID public key not configured"**
→ Add `NEXT_PUBLIC_VAPID_PUBLIC_KEY` to Vercel env vars

**"Service worker not registering"**
→ Ensure you're using HTTPS (Vercel provides this automatically)

**"Push subscription failed"**
→ Check browser console for specific error

## 📝 Full Documentation

See `VERCEL_PUSH_NOTIFICATIONS_SETUP.md` for detailed instructions.

