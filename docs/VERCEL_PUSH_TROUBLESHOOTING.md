# 🔧 Vercel Push Notifications Troubleshooting Guide

## Issue: Push Notifications Not Working on Vercel

This guide helps diagnose and fix push notification issues specifically on Vercel hosting.

---

## ⚡ Quick Start

**Most Common Issue:** Environment variables not set in Vercel Dashboard.

👉 **Visual Step-by-Step Guide:** [VERCEL_ENV_SETUP_GUIDE.md](./VERCEL_ENV_SETUP_GUIDE.md)

👉 **Quick Diagnostic:** Run `./scripts/check-push-vercel.sh` to test your deployment

---

## 🎯 Quick Diagnostic Steps

### Step 1: Check VAPID Public Key Endpoint

Visit your production API endpoint:

```
https://your-vercel-domain.vercel.app/api/push/vapid-public-key
```

**Expected Response:**
```json
{
  "publicKey": "BJ_xF7Io7_kNbMOhxXZtS5yQp1yTCccSLznVaJJrYg..."
}
```

**If you see an error response:**
```json
{
  "error": "VAPID public key not configured"
}
```
→ **Environment variables are NOT set correctly in Vercel** (see Fix #1 below)

---

### Step 2: Check Browser Console

1. Open your Vercel-hosted site
2. Press **F12** (DevTools)
3. Go to **Console** tab
4. Try to enable push notifications
5. Look for error messages

**Common errors and their meanings:**

| Error Message | Cause | Fix |
|--------------|-------|-----|
| "VAPID public key not available" | Environment variables not set | Fix #1 |
| "Service worker registration failed" | Service worker not deployed | Fix #2 |
| "Notification permission denied" | User blocked notifications | Fix #3 |
| "Failed to subscribe to push notifications" | Server-side error | Fix #4 |

---

### Step 3: Check Service Worker

1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Service Workers** in left sidebar

**What to look for:**

✅ **Good:** Shows `sw.js` with status "activated and is running"
❌ **Bad:** No service worker listed or status is "redundant"

---

## 🔧 Common Fixes

### Fix #1: Environment Variables Not Set in Vercel

This is the **most common issue**. Vercel needs the VAPID keys configured in the dashboard.

#### Step-by-Step Solution:

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Select your project

2. **Navigate to Environment Variables:**
   - Click **Settings** tab
   - Click **Environment Variables** in left sidebar

3. **Check if VAPID variables exist:**
   - Look for: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - Look for: `VAPID_PRIVATE_KEY`
   - Look for: `VAPID_SUBJECT`

4. **If they DON'T exist, add them:**

   Click **Add New** button and add each variable:

   | Name | Value | Environments |
   |------|-------|--------------|
   | `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `BJ_xF7Io7_kNbMOhxXZtS5yQp1yTCccSLznVaJJrYg-hSBfJjPS0OtVGnN2I2MabK9-gJnkABGEVvzKmSRX8kc4` | Production, Preview, Development |
   | `VAPID_PRIVATE_KEY` | `GpGfStk41C_skuP21yx4oHwm__c4TLyLVe5a4j-gQb0` | Production, Preview, Development |
   | `VAPID_SUBJECT` | `mailto:admin@yourdomain.com` | Production, Preview, Development |

   **Important:** 
   - Copy the values from your `.env` file
   - Select **ALL environments** (Production, Preview, Development)
   - Click **Save** after each variable

5. **If they DO exist, verify the values:**
   - Click on each variable to view/edit
   - Verify the public key starts with letters (not empty)
   - Verify they're enabled for "Production" environment

6. **Redeploy your application:**
   - Go to **Deployments** tab
   - Click the **•••** (three dots) on the latest deployment
   - Click **Redeploy**
   - ✅ Check "Use existing build cache" is **UNCHECKED**
   - Click **Redeploy**

7. **Wait for deployment to complete** (1-3 minutes)

8. **Test again:**
   ```
   https://your-domain.vercel.app/api/push/vapid-public-key
   ```
   Should now return the public key!

---

### Fix #2: Service Worker Not Deployed

#### Verify Service Worker Exists:

```bash
# Visit this URL in your browser:
https://your-domain.vercel.app/sw.js
```

**Expected:** Shows JavaScript code for service worker
**If 404 error:** Service worker file not deployed

#### Solution:

1. **Check file exists locally:**
   ```bash
   ls -la public/sw.js
   ```
   Should show the file exists

2. **Verify it's not in .gitignore:**
   ```bash
   cat .gitignore | grep "sw.js"
   ```
   Should return nothing (file should NOT be ignored)

3. **Commit and push:**
   ```bash
   git add public/sw.js
   git commit -m "Ensure service worker is deployed"
   git push
   ```

4. **Vercel will auto-redeploy**

5. **Test again:** Visit `https://your-domain.vercel.app/sw.js`

---

### Fix #3: Notification Permission Denied by User

If user previously blocked notifications, they must manually re-enable:

#### Chrome/Edge:
1. Click the 🔒 lock icon in address bar
2. Click **Site settings**
3. Find **Notifications**
4. Change to **Allow**
5. Refresh page and try again

#### Firefox:
1. Click the 🔒 lock icon
2. Click **Connection secure** → **More information**
3. Go to **Permissions** tab
4. Find **Receive Notifications**
5. Uncheck **Use Default**
6. Select **Allow**
7. Refresh page

#### Safari:
1. Safari menu → **Settings**
2. Go to **Websites** tab
3. Click **Notifications** in left sidebar
4. Find your site and select **Allow**
5. Refresh page

**Test in Incognito/Private Window:** Fresh browser session without previous blocks

---

### Fix #4: Server-Side Subscription Error

Check Vercel deployment logs for errors:

1. Go to Vercel Dashboard → **Deployments**
2. Click on latest deployment
3. Click **Functions** tab
4. Look for errors in logs

**Common server errors:**

#### Error: Database Connection Failed

**Cause:** Database URL not configured or incorrect

**Solution:**
1. Go to Settings → Environment Variables
2. Verify `DATABASE_URL` is set correctly
3. Verify `DIRECT_URL` is set correctly
4. Test database connection:
   ```bash
   npx prisma db execute --stdin <<EOF
   SELECT 1;
   EOF
   ```

#### Error: PushSubscription table not found

**Cause:** Database migrations not run on production database

**Solution:**
```bash
# Run migrations on production database
npx prisma migrate deploy
```

---

## 🔍 Advanced Debugging

### Test API Endpoints Manually

#### 1. Test VAPID Public Key:
```bash
curl https://your-domain.vercel.app/api/push/vapid-public-key
```

Expected:
```json
{"publicKey":"BJ_xF7Io7..."}
```

#### 2. Test Push Subscribe (requires auth token):
```bash
curl -X POST https://your-domain.vercel.app/api/push/subscribe \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=YOUR_TOKEN" \
  -d '{
    "endpoint": "https://fcm.googleapis.com/fcm/send/test",
    "keys": {
      "p256dh": "test",
      "auth": "test"
    }
  }'
```

Expected: `{"success": true, ...}` or authentication error

---

### Check Vercel Function Logs

1. Vercel Dashboard → Deployments → Latest Deployment
2. Click **Functions** tab
3. Click on a function (e.g., `api/push/vapid-public-key`)
4. View logs for errors

**Common log errors:**

```
Error: Environment variable VAPID_PUBLIC_KEY is not defined
```
→ Environment variables not set (see Fix #1)

```
Error: connect ECONNREFUSED
```
→ Database connection issue (check DATABASE_URL)

```
PrismaClientKnownRequestError: Table 'push_subscriptions' does not exist
```
→ Run migrations: `npx prisma migrate deploy`

---

## 📋 Complete Verification Checklist

Use this checklist to verify everything is configured correctly:

### Environment Variables (Vercel Dashboard)

- [ ] `NEXT_PUBLIC_VAPID_PUBLIC_KEY` exists
- [ ] `VAPID_PRIVATE_KEY` exists
- [ ] `VAPID_SUBJECT` exists
- [ ] All three are enabled for "Production" environment
- [ ] Values are not empty
- [ ] Public key starts with letters (e.g., "BJ_xF7...")
- [ ] Variables were saved (not just entered)

### Deployment

- [ ] Latest deployment is successful (green checkmark)
- [ ] Deployment date is AFTER adding environment variables
- [ ] No build errors in deployment logs
- [ ] Functions are deployed (check Functions tab)

### API Endpoints

- [ ] `/api/push/vapid-public-key` returns public key (not error)
- [ ] `/sw.js` returns JavaScript (not 404)
- [ ] Both endpoints accessible via HTTPS

### Browser

- [ ] Service worker registers (check DevTools → Application → Service Workers)
- [ ] No console errors when loading page
- [ ] Browser supports notifications (Chrome, Firefox, Edge, Safari 16+)
- [ ] Notification permission is "default" or "granted" (not "denied")

### Database

- [ ] Database connection working
- [ ] `push_subscriptions` table exists
- [ ] Migrations are up to date

---

## 🚨 Still Not Working?

### Get More Information

Run these commands and share the output:

```bash
# 1. Check API endpoint
curl https://your-domain.vercel.app/api/push/vapid-public-key

# 2. Check service worker
curl https://your-domain.vercel.app/sw.js | head -20

# 3. Check local environment
cat .env | grep VAPID

# 4. Check git status
git status

# 5. Check Prisma schema
cat prisma/schema.prisma | grep -A 20 "model PushSubscription"
```

### Browser DevTools Information

1. Open your Vercel site
2. Press F12 (DevTools)
3. Go to **Console** tab
4. Try to enable push notifications
5. Copy any error messages

### Check Vercel Build Logs

1. Vercel Dashboard → Deployments
2. Click latest deployment
3. Scroll through "Build Logs"
4. Look for warnings or errors related to:
   - Environment variables
   - Service worker
   - Build failures

---

## 💡 Common Scenarios

### Scenario 1: "Works locally but not on Vercel"

**Cause:** Environment variables in `.env` file are not automatically transferred to Vercel

**Solution:** Must manually add environment variables in Vercel Dashboard (see Fix #1)

---

### Scenario 2: "API returns error but local works"

**Cause:** Environment variables not set in Vercel or wrong environment selected

**Solution:**
1. Check variables are set for "Production" (not just "Development")
2. Redeploy after adding variables
3. Clear Vercel build cache when redeploying

---

### Scenario 3: "Service worker won't register on Vercel"

**Causes:**
- Service worker not deployed (file missing)
- Browser cached old version
- HTTPS issue (Vercel should handle this automatically)

**Solution:**
1. Verify `/sw.js` is accessible: `https://your-domain.vercel.app/sw.js`
2. Hard refresh browser: Ctrl+Shift+R
3. Clear browser cache
4. Try incognito window
5. Check DevTools → Application → Clear storage → Clear site data

---

### Scenario 4: "Everything configured but still failing"

Try this complete reset:

1. **Unregister old service worker:**
   - DevTools → Application → Service Workers
   - Click "Unregister" on any service workers
   
2. **Clear all site data:**
   - DevTools → Application → Storage
   - Click "Clear site data"

3. **Force new deployment on Vercel:**
   - Go to Deployments
   - Click ••• on latest deployment
   - Click "Redeploy"
   - **IMPORTANT:** Uncheck "Use existing build cache"
   - Click "Redeploy"

4. **Wait for deployment** (2-3 minutes)

5. **Test in fresh incognito window**

---

## 🔑 Quick Reference: Required Environment Variables

Add these **exactly as shown** in Vercel Dashboard → Settings → Environment Variables:

```
Variable: NEXT_PUBLIC_VAPID_PUBLIC_KEY
Value: BJ_xF7Io7_kNbMOhxXZtS5yQp1yTCccSLznVaJJrYg-hSBfJjPS0OtVGnN2I2MabK9-gJnkABGEVvzKmSRX8kc4
Environments: ✅ Production ✅ Preview ✅ Development

Variable: VAPID_PRIVATE_KEY
Value: GpGfStk41C_skuP21yx4oHwm__c4TLyLVe5a4j-gQb0
Environments: ✅ Production ✅ Preview ✅ Development

Variable: VAPID_SUBJECT
Value: mailto:admin@yourdomain.com
Environments: ✅ Production ✅ Preview ✅ Development
```

**After adding all three:**
1. Click **Save**
2. Go to Deployments → Latest → ••• → **Redeploy**
3. Uncheck "Use existing build cache"
4. Click **Redeploy**
5. Wait for completion
6. Test: `https://your-domain.vercel.app/api/push/vapid-public-key`

---

## 📞 Additional Resources

- [PUSH_NOTIFICATIONS_SETUP.md](./PUSH_NOTIFICATIONS_SETUP.md) - Complete setup guide
- [PUSH_DEPLOYMENT_CHECKLIST.md](./PUSH_DEPLOYMENT_CHECKLIST.md) - Quick reference
- [NOTIFICATIONS_AND_SECURITY.md](./NOTIFICATIONS_AND_SECURITY.md) - Architecture details
- [Vercel Environment Variables Docs](https://vercel.com/docs/concepts/projects/environment-variables)

---

*Last updated: February 16, 2026*
