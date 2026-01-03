# 📋 Vercel Environment Variables Setup Instructions

## ✅ Your VAPID Keys (Generated)

You've successfully generated VAPID keys! Here's what you need to add to Vercel:

## 🔐 Add to Vercel Environment Variables

### Step 1: Go to Vercel Dashboard
1. Visit [vercel.com](https://vercel.com)
2. Select your project
3. Go to **Settings** → **Environment Variables**

### Step 2: Add These 3 Variables

Click **"Add New"** for each variable:

#### Variable 1: Public Key (Client-Side)
- **Name:** `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- **Value:** `BKZnLPtqb6jFVPubWw_dysWNRb9VVRW5xXlrCTUq4ejkFV_EoORzwcJFU6RTIQ80XzGudjsguUQAZwVxX47O8sA`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

#### Variable 2: Private Key (Server-Side Only)
- **Name:** `VAPID_PRIVATE_KEY`
- **Value:** `o7JvnY8JYWEX9WkZ900azC_208sTX5a_vTnvCu0JPMk`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

#### Variable 3: Subject (Contact Email)
- **Name:** `VAPID_SUBJECT`
- **Value:** `mailto:admin@example.com`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- **Note:** Change `admin@example.com` to your actual email address

### Step 3: Save and Redeploy

1. Click **"Save"** for each variable
2. Go to **Deployments** tab
3. Click **"Redeploy"** on the latest deployment (or push new code)

## ✅ Verification

After redeploying, verify it's working:

1. **Test API Endpoint:**
   ```
   https://your-domain.vercel.app/api/push/vapid-public-key
   ```
   Should return: `{"publicKey":"BKZnLPtqb6jFVPubWw_dysWNRb9VVRW5xXlrCTUq4ejkFV_EoORzwcJFU6RTIQ80XzGudjsguUQAZwVxX47O8sA"}`

2. **Test in Browser:**
   - Visit your deployed site
   - Click the bell icon next to notification bell
   - Grant permission
   - Icon should turn green ✅

## 🔒 Security Reminders

- ✅ Public key (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`) is safe to expose
- 🔒 Private key (`VAPID_PRIVATE_KEY`) must be kept secret
- ✅ Vercel encrypts all environment variables
- ✅ Never commit private keys to Git

## 📝 Quick Copy-Paste for Vercel Dashboard

When adding variables in Vercel, you can copy-paste these:

**Variable 1:**
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY
BKZnLPtqb6jFVPubWw_dysWNRb9VVRW5xXlrCTUq4ejkFV_EoORzwcJFU6RTIQ80XzGudjsguUQAZwVxX47O8sA
```

**Variable 2:**
```
VAPID_PRIVATE_KEY
o7JvnY8JYWEX9WkZ900azC_208sTX5a_vTnvCu0JPMk
```

**Variable 3:**
```
VAPID_SUBJECT
mailto:admin@example.com
```

(Change the email in Variable 3 to your actual email)

## 🎉 That's It!

Once you've added these to Vercel and redeployed, web push notifications will work on your production site!

