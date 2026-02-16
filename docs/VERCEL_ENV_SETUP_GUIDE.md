# 🎯 Vercel Environment Variables - Visual Setup Guide

## The #1 Reason Push Notifications Don't Work on Vercel

**99% of the time, the issue is:** Environment variables are not configured in Vercel Dashboard.

Your `.env` file on your computer is **NOT automatically** transferred to Vercel. You must manually add them.

---

## 📝 Step-by-Step: Add Environment Variables to Vercel

### Step 1: Go to Vercel Dashboard

1. Open: https://vercel.com/dashboard
2. Sign in if needed
3. Click on your project name

---

### Step 2: Navigate to Environment Variables

```
Dashboard → [Your Project] → Settings → Environment Variables
```

Or directly: `https://vercel.com/[your-username]/[your-project]/settings/environment-variables`

---

### Step 3: Add Each Variable

Click the **"Add New"** button (top right) and add **each of these 3 variables:**

#### Variable 1: NEXT_PUBLIC_VAPID_PUBLIC_KEY

```
Name: NEXT_PUBLIC_VAPID_PUBLIC_KEY

Value: BJ_xF7Io7_kNbMOhxXZtS5yQp1yTCccSLznVaJJrYg-hSBfJjPS0OtVGnN2I2MabK9-gJnkABGEVvzKmSRX8kc4

Environments: 
  ☑ Production
  ☑ Preview
  ☑ Development

Click: Save
```

#### Variable 2: VAPID_PRIVATE_KEY

```
Name: VAPID_PRIVATE_KEY

Value: GpGfStk41C_skuP21yx4oHwm__c4TLyLVe5a4j-gQb0

Environments: 
  ☑ Production
  ☑ Preview
  ☑ Development

Click: Save
```

#### Variable 3: VAPID_SUBJECT

```
Name: VAPID_SUBJECT

Value: mailto:admin@yourdomain.com

Environments: 
  ☑ Production
  ☑ Preview
  ☑ Development

Click: Save
```

---

### Step 4: Verify Variables Were Added

You should now see **3 variables** in the list:

```
✅ NEXT_PUBLIC_VAPID_PUBLIC_KEY    Production, Preview, Development
✅ VAPID_PRIVATE_KEY                Production, Preview, Development
✅ VAPID_SUBJECT                    Production, Preview, Development
```

**Common Mistake:** Variables were entered but not saved. Click each one to verify it has a value.

---

### Step 5: Redeploy Your Application

**CRITICAL:** Environment variables only take effect AFTER redeployment.

#### Method 1: Automatic (if you push to Git)

```bash
git add .
git commit -m "Ready for push notifications"
git push
```

Vercel will automatically redeploy.

#### Method 2: Manual Redeploy

1. Go to **Deployments** tab
2. Find the latest deployment (top of list)
3. Click the **•••** (three dots) on the right
4. Click **"Redeploy"**
5. **IMPORTANT:** **UNCHECK** "Use existing build cache"
6. Click **"Redeploy"** button
7. Wait 1-3 minutes for deployment to complete

---

### Step 6: Test Your Deployment

Once deployment is complete (green checkmark), test the API endpoint:

```
https://your-app.vercel.app/api/push/vapid-public-key
```

**✅ Success Response:**
```json
{
  "publicKey": "BJ_xF7Io7_kNbMOhxXZtS5yQp1yTCccSLznVaJJrYg..."
}
```

**❌ Error Response:**
```json
{
  "error": "VAPID public key not configured"
}
```

If you see the error:
1. Go back to Step 3 - verify all 3 variables are saved
2. Check they're enabled for "Production" environment
3. Redeploy again (Step 5) - **MUST uncheck build cache**

---

## 🔍 Quick Diagnostic Script

Run this from your terminal to automatically test your Vercel deployment:

```bash
./scripts/check-push-vercel.sh
```

Enter your Vercel domain when prompted, and it will check:
- ✅ VAPID public key is configured
- ✅ Service worker is deployed
- ✅ HTTPS is enabled
- ✅ Headers are correct

---

## 📋 Troubleshooting Checklist

If push notifications still don't work after adding environment variables:

### ✅ Verify Environment Variables

- [ ] All 3 variables exist in Vercel Dashboard
- [ ] Each variable has a value (click to expand and check)
- [ ] Variables are enabled for "Production" environment
- [ ] Variable names are **exactly** as shown (case-sensitive)
- [ ] No extra spaces in variable names or values
- [ ] Values are complete (not truncated)

### ✅ Verify Deployment

- [ ] Latest deployment shows green checkmark (successful)
- [ ] Deployment timestamp is **AFTER** adding environment variables
- [ ] Build cache was cleared when redeploying
- [ ] No errors in deployment logs

### ✅ Test API Endpoint

```bash
curl https://your-app.vercel.app/api/push/vapid-public-key
```

- [ ] Returns 200 status code
- [ ] Response includes "publicKey" field
- [ ] Public key value starts with letters (e.g., "BJ_xF...")

### ✅ Test Service Worker

```bash
curl https://your-app.vercel.app/sw.js
```

- [ ] Returns 200 status code (not 404)
- [ ] Response is JavaScript code
- [ ] File starts with "// Service Worker"

### ✅ Browser Testing

- [ ] Open site in browser
- [ ] Press F12 → Console tab
- [ ] No errors about VAPID key
- [ ] Service worker registers (Application → Service Workers)
- [ ] Can enable push notifications

---

## 🚨 Common Mistakes

### ❌ Mistake 1: Variables Not Saved

**Problem:** Variables were entered in the form but "Save" button not clicked

**Fix:** Click each variable to expand it and verify it has a value

---

### ❌ Mistake 2: Wrong Environment Selected

**Problem:** Variables added only to "Development" but you're testing "Production"

**Fix:** Edit each variable and check **all 3 checkboxes**: Production, Preview, Development

---

### ❌ Mistake 3: Didn't Redeploy

**Problem:** Variables were added but application not redeployed

**Fix:** Go to Deployments → ••• → Redeploy (uncheck build cache)

---

### ❌ Mistake 4: Using Build Cache

**Problem:** Redeployed but checked "Use existing build cache"

**Fix:** Redeploy again with build cache **UNCHECKED**

---

### ❌ Mistake 5: Typo in Variable Name

**Problem:** Variable name has typo or wrong case

**Fix:** Variable names must be **EXACTLY**:
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (not `VAPID_PUBLIC_KEY` or `NEXT_PUBLIC_VAPID`)
- `VAPID_PRIVATE_KEY` (not `VAPID_PRIVATE` or `PRIVATE_KEY`)
- `VAPID_SUBJECT` (not `SUBJECT`)

---

### ❌ Mistake 6: Extra Spaces in Value

**Problem:** Copied value with leading/trailing spaces

**Fix:** 
1. Edit the variable in Vercel
2. Delete the value
3. Paste again carefully (no spaces before or after)
4. Save

---

### ❌ Mistake 7: Wrong Keys Used

**Problem:** Used different VAPID keys than in `.env` file

**Fix:** Copy the exact values from your `.env` file:

```bash
# Show your VAPID keys
cat .env | grep VAPID
```

Copy these exact values to Vercel.

---

## 💡 Pro Tips

### Tip 1: Import from File (Fastest Method)

If you have many environment variables:

1. Create a `vercel-env-import.txt` file:
   ```
   NEXT_PUBLIC_VAPID_PUBLIC_KEY="BJ_xF7Io7_kNbMOhxXZtS5yQp1yTCccSLznVaJJrYg..."
   VAPID_PRIVATE_KEY="GpGfStk41C_skuP21yx4oHwm__c4TLyLVe5a4j-gQb0"
   VAPID_SUBJECT="mailto:admin@yourdomain.com"
   ```

2. In Vercel Dashboard → Environment Variables
3. Click **"Import"** button (top right)
4. Select your file
5. Click **"Import"**

**Warning:** Don't commit this file to Git! Add to `.gitignore`.

---

### Tip 2: Verify with Vercel CLI

If you have Vercel CLI installed:

```bash
# Install CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# List environment variables
vercel env ls

# Should show:
# NEXT_PUBLIC_VAPID_PUBLIC_KEY
# VAPID_PRIVATE_KEY
# VAPID_SUBJECT
```

---

### Tip 3: Test in Preview Deployment First

Before deploying to production:

1. Create a new branch
2. Push to trigger preview deployment
3. Test push notifications on preview URL
4. If works, merge to main

---

## 📞 Still Need Help?

If push notifications still don't work after following this guide:

1. **Run diagnostic script:**
   ```bash
   ./scripts/check-push-vercel.sh
   ```

2. **Check detailed troubleshooting:**
   - [VERCEL_PUSH_TROUBLESHOOTING.md](./VERCEL_PUSH_TROUBLESHOOTING.md)

3. **Review full setup guide:**
   - [PUSH_NOTIFICATIONS_SETUP.md](./PUSH_NOTIFICATIONS_SETUP.md)

4. **Check Vercel logs:**
   - Dashboard → Deployments → Latest → Functions
   - Look for error messages

---

## ✅ Success Checklist

Push notifications are working when:

- [ ] `/api/push/vapid-public-key` returns public key
- [ ] Service worker registers in browser
- [ ] "Enable Push Notifications" button works
- [ ] Browser prompts for notification permission
- [ ] Subscription saves to database
- [ ] Test notification appears
- [ ] Notification works when tab is closed

---

*Last updated: February 16, 2026*
