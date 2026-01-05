# Request Inquiry System Setup Guide

This guide will help you set up the Request Inquiry system with a separate Supabase database.

## Overview

The Request Inquiry system allows you to:
- View request inquiries from a separate database
- Convert request inquiries to regular inquiries with one click
- Track which requests have been converted
- See converted inquiries highlighted in light red and moved to the bottom

## Database Setup

### 1. Add Database Connection to `.env`

Add the following to your `.env` file:

```env
# Request Inquiry Database (Separate Supabase Instance)
REQUEST_INQUIRY_DATABASE_URL="postgresql://postgres.pcrdpephzjfanaxelzgz:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
```

**Important:** Replace `[YOUR-PASSWORD]` with your actual Supabase database password.

### 2. Generate Prisma Client for Request Inquiries

Run the following command to generate the Prisma client for the request inquiry database:

```bash
npm run db:generate:request-inquiry
```

### 3. Push Schema to Database

Create the `request_inquiries` table in your Supabase database:

```bash
npm run db:push:request-inquiry
```

This will create the `request_inquiries` table with the following structure:
- `id` (String, Primary Key)
- `fullName` (String)
- `phone` (String)
- `email` (String, Optional)
- `whatsapp` (Boolean)
- `whatsappNumber` (String, Optional)
- `city` (String, Optional)
- `ageBand` (String, Optional)
- `guardianPhone` (String, Optional)
- `marketingSource` (String, Optional)
- `preferredContactTime` (String, Optional)
- `preferredStatus` (Int, Optional)
- `description` (String, Optional)
- `consent` (Boolean)
- `isConverted` (Boolean, Default: false)
- `convertedAt` (DateTime, Optional)
- `convertedById` (String, Optional)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

## Usage

### Accessing Request Inquiries

1. Navigate to the **Inquiries** page
2. Click on the **"Request Inquiries"** tab
3. You'll see a table of all request inquiries

### Converting Request Inquiries

1. Find the request inquiry you want to convert
2. Click the **"Create Inquiry"** button in the Actions column
3. The system will:
   - Create a regular inquiry in the main database
   - Create automatic follow-up tasks (3 days and 7 days)
   - Mark the request inquiry as converted
   - Highlight the row in light red
   - Move it to the bottom of the list

### Visual Feedback

- **Pending requests**: Normal background, "Pending" badge
- **Converted requests**: Light red background (`bg-red-50`), "Converted" badge, button disabled

## API Endpoints

### GET `/api/request-inquiries`
Fetch all request inquiries (sorted: non-converted first, then by creation date)

### POST `/api/request-inquiries`
Create a new request inquiry

### POST `/api/request-inquiries/[id]/convert`
Convert a request inquiry to a regular inquiry

## Features

- ✅ Separate database connection (doesn't affect main database)
- ✅ Automatic inquiry creation with all fields
- ✅ Automatic follow-up task creation
- ✅ Visual feedback (light red color for converted)
- ✅ Auto-sorting (converted items move to bottom)
- ✅ Real-time updates (polls every 30 seconds)
- ✅ Error handling and user feedback

## Troubleshooting

### Error: "Request Inquiry Prisma client not available"

**Solution:** Run `npm run db:generate:request-inquiry`

### Error: "Table 'request_inquiries' does not exist"

**Solution:** Run `npm run db:push:request-inquiry`

### Error: "Connection refused" or "Database connection failed"

**Solution:** 
1. Check your `REQUEST_INQUIRY_DATABASE_URL` in `.env`
2. Verify your Supabase database is running
3. Check your password is correct
4. Ensure your IP is whitelisted in Supabase (if required)

## Notes

- The request inquiry database is completely separate from the main database
- Converting a request inquiry creates a new inquiry in the main database
- The original request inquiry is marked as converted but remains in the request database
- Duplicate phone numbers are checked before conversion
- All converted inquiries follow the same process as manually created inquiries

