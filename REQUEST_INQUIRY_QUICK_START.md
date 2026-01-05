# Request Inquiry System - Quick Start

## 🚀 Quick Setup (3 Steps)

### Step 1: Add Database URL to `.env`

Add this line to your `.env` file:

```env
REQUEST_INQUIRY_DATABASE_URL="postgresql://postgres.pcrdpephzjfanaxelzgz:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
```

**⚠️ Important:** Replace `[YOUR-PASSWORD]` with your actual Supabase password.

### Step 2: Generate Prisma Client

```bash
npm run db:generate:request-inquiry
```

### Step 3: Create Database Table

```bash
npm run db:push:request-inquiry
```

## ✅ Done!

Now you can:
1. Go to **Inquiries** page
2. Click **"Request Inquiries"** tab
3. See all request inquiries
4. Click **"Create Inquiry"** to convert them

## 📋 Features

- ✅ Separate database (doesn't affect main database)
- ✅ One-click conversion to regular inquiry
- ✅ Automatic follow-up tasks created
- ✅ Visual feedback (light red for converted)
- ✅ Auto-sorted (converted items at bottom)

## 🔧 Troubleshooting

**Error: "Request Inquiry Prisma client not available"**
→ Run: `npm run db:generate:request-inquiry`

**Error: "Table does not exist"**
→ Run: `npm run db:push:request-inquiry`

**Error: "Connection failed"**
→ Check your `REQUEST_INQUIRY_DATABASE_URL` in `.env`

