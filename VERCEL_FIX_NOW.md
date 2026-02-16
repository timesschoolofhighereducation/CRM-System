# 🚨 URGENT: Fix Push Notifications on Vercel NOW

## The Problem

Push notifications work locally but **NOT on Vercel hosting**.

## The Solution (5 minutes)

Your `.env` file is **NOT** automatically uploaded to Vercel. You must add environment variables manually.

---

## 🎯 DO THIS NOW - 3 Simple Steps

### Step 1: Go to Vercel Dashboard

Open: https://vercel.com/dashboard → Click your project → **Settings** → **Environment Variables**

---

### Step 2: Add These 3 Variables

Click **"Add New"** for each:

#### Variable 1:
```
Name:    NEXT_PUBLIC_VAPID_PUBLIC_KEY
Value:   BJ_xF7Io7_kNbMOhxXZtS5yQp1yTCccSLznVaJJrYg-hSBfJjPS0OtVGnN2I2MabK9-gJnkABGEVvzKmSRX8kc4
Envs:    ✅ Production  ✅ Preview  ✅ Development
```

#### Variable 2:
```
Name:    VAPID_PRIVATE_KEY
Value:   GpGfStk41C_skuP21yx4oHwm__c4TLyLVe5a4j-gQb0
Envs:    ✅ Production  ✅ Preview  ✅ Development
```

#### Variable 3:
```
Name:    VAPID_SUBJECT
Value:   mailto:admin@yourdomain.com
Envs:    ✅ Production  ✅ Preview  ✅ Development
```

**IMPORTANT:** Click **Save** after each one!

---

### Step 3: Redeploy

1. Go to **Deployments** tab
2. Click **•••** on latest deployment
3. Click **Redeploy**
4. **UNCHECK** "Use existing build cache" ← CRITICAL!
5. Click **Redeploy**
6. Wait 2-3 minutes

---

## ✅ Test It Works

Visit: `https://your-app.vercel.app/api/push/vapid-public-key`

**✅ Should see:**
```json
{"publicKey":"BJ_xF7Io7_kNbMOhxXZtS5yQp1yTCccSLznVaJJrYg..."}
```

**❌ If you see error:** Variables not saved correctly. Go back to Step 2.

---

## 🚀 Quick Test Script

Run this to automatically check everything:

```bash
./scripts/check-push-vercel.sh
```

It will tell you exactly what's wrong.

---

## 📖 More Help Needed?

**Visual Guide (recommended):** `docs/VERCEL_ENV_SETUP_GUIDE.md`  
**Full Troubleshooting:** `docs/VERCEL_PUSH_TROUBLESHOOTING.md`  
**Complete Setup Guide:** `docs/PUSH_NOTIFICATIONS_SETUP.md`

---

## 🔍 Still Not Working? Checklist:

- [ ] Added **all 3** environment variables in Vercel
- [ ] Checked **all 3 environment** boxes (Production, Preview, Development)
- [ ] Clicked **Save** for each variable
- [ ] **Redeployed** with build cache **unchecked**
- [ ] Waited for deployment to complete (green checkmark)
- [ ] Tested API endpoint returns public key
- [ ] Cleared browser cache and tried again

---

## 💡 Common Mistakes

1. ❌ **Didn't click Save** → Variables not actually saved
2. ❌ **Only selected "Development"** → Must select all 3 environments
3. ❌ **Didn't redeploy** → Changes don't take effect until redeploy
4. ❌ **Used build cache** → Old build doesn't have new variables
5. ❌ **Typo in variable name** → Must be exact (case-sensitive)

---

## 🎉 It Works When...

- ✅ API endpoint returns public key (no error)
- ✅ Browser prompts for notification permission
- ✅ "Push notifications enabled" message shows
- ✅ Can receive notifications even when tab closed

---

**DO THESE 3 STEPS NOW:**
1. Add 3 environment variables to Vercel Dashboard
2. Redeploy (uncheck build cache)
3. Test: https://your-app.vercel.app/api/push/vapid-public-key

**This will fix 99% of Vercel push notification issues!**

---

*Quick Fix Guide - February 16, 2026*
