# Request Inquiry System Improvements

## Overview
This document describes the improvements made to the Request Inquiry (Exhibition Registration) system to better handle multiple program requests and improve coordinator workflow.

## Changes Implemented

### 1. Manual Refresh Button (Completed)
**Location:** `src/components/inquiries/request-inquiries-table.tsx`

**Changes:**
- ✅ Removed automatic 30-second polling refresh
- ✅ Added manual "Refresh" button in the header
- ✅ Shows loading state while refreshing
- ✅ Displays success toast notification on refresh

**Benefits:**
- Reduces unnecessary API calls
- Gives users control over when to fetch new data
- Improves performance and reduces server load

---

### 2. Advanced Search and Filtering (Completed)
**Location:** `src/components/inquiries/request-inquiries-table.tsx`

**Features Added:**
- ✅ **Search Bar**: Search by visitor name or phone number
- ✅ **Program Filter**: Dropdown to filter by specific programs
- ✅ **Date Range Filter**: Calendar picker to filter by registration date
- ✅ **Clear Filters Button**: Quickly reset all filters
- ✅ **Results Counter**: Shows "X of Y visitors" based on active filters

**API Integration:**
- Programs are fetched from the request inquiry database: `GET /api/request-inquiries/programs`
- All filtering happens client-side for instant results

**Benefits:**
- Coordinators can quickly find specific inquiries
- Easy to see inquiries for specific programs
- Filter by date to see recent registrations

---

### 3. One Inquiry Per Program (Completed)
**Location:** `src/app/api/request-inquiries/[id]/convert/route.ts`

**Changes:**
- ✅ Modified conversion logic to create **ONE inquiry per requested program**
- ✅ Each inquiry is assigned to the same phone number but different program
- ✅ Separate follow-up tasks created for each program inquiry
- ✅ Program-specific descriptions in each inquiry

**Example:**
If a visitor requests:
- BSc Business Administration
- BSc Supply Chain Management
- BSc Transportation Management

The system now creates **3 separate inquiries**, one for each program.

**Benefits:**
- Each program coordinator gets their own inquiry to handle
- Better tracking of program-specific follow-ups
- No confusion about which program the inquiry is for

---

### 4. Allow Duplicate Phone Numbers (Completed)
**Locations:**
- `prisma/schema.prisma`
- `prisma/schema.sqlite.prisma`
- `src/app/api/inquiries/route.ts`
- `prisma/migrations/20260119141643_remove_phone_unique_constraint/migration.sql`

**Changes:**
- ✅ Removed `@unique` constraint from `phone` field in Seeker model
- ✅ Created database migration to drop the unique index
- ✅ Removed phone duplicate check in inquiry creation API
- ✅ Added comment explaining the change

**Benefits:**
- Same person can register for multiple programs
- No error when creating inquiries for same phone number
- Supports the one-inquiry-per-program model

---

### 5. UI Improvements (Completed)
**Location:** `src/components/inquiries/request-inquiries-table.tsx`

**Changes:**
- ✅ Updated button text from "Create Inquiry" to "Create Inquiries" (plural)
- ✅ Shows program count under button when multiple programs selected
- ✅ Improved conversion flow - direct API call without dialog
- ✅ Better success/error messages showing how many inquiries were created
- ✅ Warning toast if some programs failed to convert

---

## Technical Implementation Details

### Database Schema Changes

```prisma
model Seeker {
  id       String  @id @default(cuid())
  fullName String
  phone    String  // ← Removed @unique constraint
  // ... other fields
}
```

### Migration
```sql
-- Drop the unique index on phone
DROP INDEX IF EXISTS "seekers_phone_key";
```

### API Response Format

When converting a visitor with multiple programs, the API now returns:

```json
{
  "success": true,
  "inquiries": [
    { "id": "...", "fullName": "...", "phone": "...", "preferredPrograms": [...] },
    { "id": "...", "fullName": "...", "phone": "...", "preferredPrograms": [...] }
  ],
  "visitor": { "id": "...", "isConverted": true, "convertedAt": "..." },
  "message": "Successfully created 2 inquiries (one per program)",
  "failedPrograms": [] // Optional: list of programs that failed to convert
}
```

---

## How to Use the New Features

### For Coordinators

1. **Manual Refresh**:
   - Click the "Refresh" button in the top right to get latest data
   - No more automatic refreshes that interrupt your work

2. **Search and Filter**:
   - Type in the search bar to find specific visitors
   - Use the program dropdown to see only inquiries for your programs
   - Pick a date range to see recent registrations
   - Click "Clear" to reset all filters

3. **Converting Inquiries**:
   - Click "Create Inquiries" button
   - System automatically creates one inquiry per program
   - Each program coordinator will see their own inquiry
   - Follow-up tasks are created for each inquiry

### For Administrators

1. **Run Database Migration**:
   ```bash
   # If using .env file
   npx prisma migrate deploy
   
   # Or manually run the SQL in your database:
   DROP INDEX IF EXISTS "seekers_phone_key";
   ```

2. **Verify Changes**:
   - Check that duplicate phone numbers are now allowed
   - Test creating inquiries for same phone with different programs
   - Verify search and filters work correctly

---

## Breaking Changes

⚠️ **Database Migration Required**
- The unique constraint on phone numbers must be removed
- Run the migration before deploying this code

⚠️ **API Response Changed**
- `/api/request-inquiries/[id]/convert` now returns array of `inquiries` instead of single `inquiry`
- Client code updated to handle this change

---

## Future Enhancements

Potential improvements for future iterations:

1. **Bulk Operations**: Convert multiple visitors at once
2. **Status Tracking**: Show which program coordinator claimed each inquiry
3. **Export Filters**: Export filtered results to Excel/PDF
4. **Program Coordinator Assignment**: Auto-assign based on program preferences
5. **Duplicate Detection**: Smart detection of similar inquiries with warnings

---

## Testing Checklist

- [ ] Manual refresh button works and shows loading state
- [ ] Search filters by name and phone correctly
- [ ] Program filter shows correct programs and filters accurately
- [ ] Date range filter works for single date and date ranges
- [ ] Clear filters button resets all filters
- [ ] Converting visitor with multiple programs creates multiple inquiries
- [ ] Same phone number can be used in multiple inquiries
- [ ] Each inquiry has correct program assignment
- [ ] Follow-up tasks created for each inquiry
- [ ] Success/error messages display correctly
- [ ] Migration runs successfully on production database

---

## Support

For questions or issues with these changes, contact the development team or refer to:
- `/src/components/inquiries/request-inquiries-table.tsx` - Frontend component
- `/src/app/api/request-inquiries/[id]/convert/route.ts` - Conversion logic
- `/prisma/migrations/20260119141643_remove_phone_unique_constraint/` - Database migration

---

**Last Updated:** January 19, 2026
**Version:** 1.0.0
