# Request Inquiry System Improvements

## Summary of Changes

This document outlines the improvements made to the Request Inquiry (Exhibition Registration Requests) system.

## Features Implemented

### 1. Manual Refresh Button ✅
- **Location**: Exhibition Registration Requests section
- **What Changed**: 
  - Removed automatic 30-second polling refresh
  - Added manual "Refresh" button in the header
  - Button shows loading state with spinning icon while refreshing
- **Benefit**: Users have full control over when to refresh data, reducing unnecessary API calls

### 2. Advanced Search and Filtering ✅
- **Location**: Exhibition Registration Requests section
- **Features Added**:
  - **Search Bar**: Search by name, phone number, or program name
  - **Program Filter**: Dropdown to filter by specific programs (auto-populated from database)
  - **Date Range Filter**: Calendar picker to filter registrations by date range
  - **Clear Filters**: Quick button to reset all filters
- **Benefit**: Easy to find specific registrations among large datasets

### 3. Split Multiple Programs into Separate Rows ✅
- **What Changed**: 
  - Previously: One visitor with multiple programs showed as a single row with comma-separated programs
  - Now: Each program creates a separate row for the same visitor
  - Example:
    ```
    Before:
    Sampath | 0771234567 | Program 1, Program 2 | ... | Create Inquiry

    After:
    Sampath | 0771234567 | Program 1 | ... | Create Inquiry
    Sampath | 0771234567 | Program 2 | ... | Create Inquiry
    ```
- **Benefit**: 
  - Each program coordinator can create their own inquiry
  - Clear visibility of which program each request is for
  - Better tracking per program

### 4. Allow Duplicate Phone Numbers ✅
- **What Changed**: 
  - API now accepts `allowDuplicatePhone: true` parameter
  - When creating multiple inquiries for the same person (different programs), duplicates are allowed
  - Default behavior (without flag) still prevents duplicates
- **Location**: `/api/inquiries` POST endpoint
- **Benefit**: Same person can register for multiple programs without phone number conflicts

### 5. Auto-Fetch Programs for Filters ✅
- **What Changed**: 
  - Programs are automatically fetched from the request inquiry database
  - Program filter dropdown is dynamically populated
- **API Endpoint**: `/api/request-inquiries/programs`
- **Benefit**: Always up-to-date program list without manual configuration

## Technical Details

### Files Modified

1. **`src/components/inquiries/request-inquiries-table.tsx`**
   - Added search, program filter, and date range filter states
   - Implemented data expansion logic to split visitors by programs
   - Added manual refresh functionality
   - Removed automatic polling interval
   - Updated UI to show individual programs per row

2. **`src/app/api/inquiries/route.ts`**
   - Modified duplicate phone check to respect `allowDuplicatePhone` flag
   - Allows creating multiple inquiries for same phone when flag is true

3. **`src/components/inquiries/new-inquiry-dialog.tsx`**
   - Updated `ExhibitionVisitorData` interface to include `selectedProgram`
   - Already had `allowDuplicatePhone: true` in multi-program creation logic

### Data Flow

```
Exhibition Registration Request
         ↓
User clicks "Create Inquiry" on specific program row
         ↓
Opens NewInquiryDialog with:
  - Pre-filled name, phone
  - Selected program highlighted
  - allowDuplicatePhone: true (for multi-program scenarios)
         ↓
Creates inquiry in main CRM system
         ↓
Marks request as "Converted"
```

### Filter Logic

```typescript
// Search Filter
Matches: name, phone, program name (case-insensitive)

// Program Filter
Filters by exact program ID match

// Date Range Filter
Filters by registration createdAt date
Supports single date or date range
```

## Usage Guide

### For Program Coordinators

1. **View Requests**:
   - Navigate to Inquiries → Request Inquiries tab
   - See all exhibition registration requests

2. **Filter Requests**:
   - Use search bar to find specific visitors
   - Select your program from the program dropdown
   - Use date picker to filter by registration date
   - Click "Clear" to reset all filters

3. **Create Inquiry**:
   - Each program shows as a separate row
   - Click "Create Inquiry" button for your program
   - Form pre-fills with visitor information
   - Submit to create inquiry in CRM

4. **Refresh Data**:
   - Click the "Refresh" button in the header
   - No automatic refresh - you control when to update

### For Administrators

- **Monitor Conversions**: Converted requests show with red background
- **Track by Program**: Use program filter to see which programs have most requests
- **Date Analysis**: Use date range filter for time-based reports

## Benefits

1. **Better Organization**: Each program coordinator sees only relevant requests
2. **No Conflicts**: Duplicate phone numbers allowed for multi-program registrations
3. **Efficient Filtering**: Quick search and filter capabilities
4. **Manual Control**: No automatic refreshing - user-initiated updates
5. **Clear Tracking**: Separate rows per program for better visibility

## API Endpoints Used

- `GET /api/request-inquiries` - Fetch all exhibition visitors
- `GET /api/request-inquiries/programs` - Fetch available programs
- `POST /api/inquiries` - Create new inquiry (with allowDuplicatePhone support)
- `POST /api/request-inquiries/[id]/mark-converted` - Mark visitor as converted

## Future Enhancements (Optional)

- [ ] Add bulk actions (convert multiple requests at once)
- [ ] Export filtered results to Excel/CSV
- [ ] Email notifications for new registrations
- [ ] Program coordinator assignment
- [ ] Conversion rate analytics per program
