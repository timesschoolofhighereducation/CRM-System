# Exhibition Registration Requests - Feature Improvements

## Overview
This document outlines the improvements made to the Exhibition Registration Requests system to better handle visitor inquiries and program-specific conversions.

## Features Implemented

### 1. Manual Refresh Button ✅
**Location:** `src/components/inquiries/request-inquiries-table.tsx`

- **Added:** Manual refresh button in the header with loading spinner animation
- **Removed:** Auto-refresh that was polling every 30 seconds
- **Benefit:** Users now have full control over when to refresh data, reducing unnecessary API calls

### 2. Universal Search Bar ✅
**Location:** `src/components/inquiries/request-inquiries-table.tsx`

- **Added:** Comprehensive search functionality that searches across:
  - Visitor name
  - Phone number
  - Programs
  - Location (city, country)
  - Device information (browser, device type)
- **UI:** Clean search bar with search icon
- **Real-time:** Filters update instantly as you type

### 3. Advanced Filters ✅
**Location:** `src/components/inquiries/request-inquiries-table.tsx`

#### Program Filter
- Dropdown to filter by specific program
- Automatically populated from all programs in the data
- Shows "All Programs" option to clear filter

#### Date Range Filter
- Two calendar pickers: "From" and "To" dates
- Filters registrations by creation date
- Handles end-of-day for "To" date correctly

#### Filter UI
- Collapsible filter panel (toggle with "Filters" button)
- Active filter indicator (dot badge on Filters button)
- "Clear" button to reset all filters at once
- Shows count of filtered results

### 4. Multiple Inquiries per Program ✅
**The Big Feature:** When a visitor registers for multiple programs, the system now creates separate inquiries for each program.

#### Why This Matters
- Different program coordinators can handle their own program inquiries
- Each coordinator only sees inquiries relevant to their programs
- Better tracking and accountability per program

#### Implementation Details

##### New API Endpoint
**File:** `src/app/api/request-inquiries/[id]/convert-to-inquiries/route.ts`

- **Endpoint:** `POST /api/request-inquiries/[id]/convert-to-inquiries`
- **Function:** Creates one inquiry per program for a visitor
- **Features:**
  - Loops through all programs the visitor selected
  - Creates separate inquiry for each program
  - Links each inquiry to its specific program
  - Adds program name to inquiry description for tracking
  - Marks visitor as converted after successful creation
  - Returns detailed response with success/error counts

##### Updated Dialog Logic
**File:** `src/components/inquiries/new-inquiry-dialog.tsx`

- **Detection:** Automatically detects if visitor has multiple programs
- **Smart Routing:** 
  - Single program → Uses regular inquiry creation endpoint
  - Multiple programs → Uses new multi-inquiry endpoint
- **User Feedback:**
  - Shows count of inquiries created
  - Displays warnings if any programs failed to convert
  - Clear success messages

##### Enhanced Table Display
**File:** `src/components/inquiries/request-inquiries-table.tsx`

- **Program Count Badge:** Shows "X programs" badge when visitor has multiple programs
- **Smart Button Text:** 
  - Single program: "Create Inquiry"
  - Multiple programs: "Create 3 Inquiries" (shows actual count)
- **Tooltip:** Hover over button to see explanation
- **Validation:** Prevents conversion if visitor has no programs

## User Experience Improvements

### Visual Indicators
1. **Loading States:** Spinner animations during refresh and conversion
2. **Filter Badges:** Visual indicator when filters are active
3. **Program Count:** Clear badge showing number of programs per visitor
4. **Status Colors:** 
   - Pending: Blue badge
   - Converted: Red badge with red row highlight

### Responsive Design
- All filters work on mobile and desktop
- Collapsible filter panel saves screen space
- Search bar adapts to screen size

### Error Handling
- Validates visitor has programs before conversion
- Shows appropriate error messages
- Prevents duplicate conversions
- Handles partial failures gracefully

## Technical Details

### Data Flow
```
1. Visitor registers on exhibition form
   ↓
2. Data stored in request-inquiry database
   ↓
3. Staff views in "Request Inquiries" tab
   ↓
4. Staff applies filters/search to find visitor
   ↓
5. Staff clicks "Create X Inquiries" button
   ↓
6. System creates separate inquiry for each program
   ↓
7. Each inquiry assigned to respective program coordinator
   ↓
8. Visitor marked as converted
```

### Database Structure
- **Exhibition Visitors:** Stored in separate database (request-inquiry)
- **Inquiries:** Stored in main database (seekers table)
- **Link:** Each inquiry links to one program via `preferredPrograms` relation

### API Endpoints Used
- `GET /api/request-inquiries` - Fetch all exhibition visitors
- `POST /api/request-inquiries/[id]/convert-to-inquiries` - Convert to multiple inquiries
- `POST /api/request-inquiries/[id]/mark-converted` - Mark as converted (fallback)
- `POST /api/inquiries` - Create single inquiry (regular flow)

## Benefits Summary

### For Staff
- ✅ Better control with manual refresh
- ✅ Faster finding with universal search
- ✅ Precise filtering by program and date
- ✅ Clear visibility of program count

### For Program Coordinators
- ✅ Each gets their own inquiry to handle
- ✅ No confusion about who handles what
- ✅ Better accountability per program
- ✅ Independent workflow per program

### For Management
- ✅ Better tracking of conversion rates per program
- ✅ Clear audit trail of who created inquiries
- ✅ Reduced data duplication
- ✅ More organized inquiry management

## Usage Instructions

### Filtering Registrations
1. Click the "Filters" button in the header
2. Select a program from the dropdown (optional)
3. Choose date range (optional)
4. Use search bar for quick text search
5. Click "Clear" to reset all filters

### Converting to Inquiries
1. Find the visitor in the table
2. Check the program count badge
3. Click "Create X Inquiries" button
4. Fill in the inquiry form
5. Submit - system creates one inquiry per program
6. Visitor row turns red (converted state)

### Manual Refresh
- Click the "Refresh" button in the header anytime
- Spinner shows while loading
- Toast notification confirms refresh

## Files Modified

1. `src/components/inquiries/request-inquiries-table.tsx` - Main component with all UI improvements
2. `src/components/inquiries/new-inquiry-dialog.tsx` - Logic for multi-inquiry creation
3. `src/app/api/request-inquiries/[id]/convert-to-inquiries/route.ts` - New API endpoint

## Testing Checklist

- [ ] Manual refresh button works
- [ ] Search filters across all fields
- [ ] Program filter shows all programs
- [ ] Date range filter works correctly
- [ ] Clear button resets all filters
- [ ] Single program creates 1 inquiry
- [ ] Multiple programs create N inquiries
- [ ] Program count badge displays correctly
- [ ] Button text updates based on program count
- [ ] Converted visitors show red background
- [ ] Toast notifications appear correctly
- [ ] No duplicate inquiries created
- [ ] Each inquiry links to correct program

## Future Enhancements (Optional)

1. **Bulk Conversion:** Select multiple visitors and convert all at once
2. **Export Filtered Data:** Export filtered results to Excel
3. **Status Filter:** Filter by converted/pending status
4. **Program Coordinator Assignment:** Auto-assign to coordinator based on program
5. **Notification System:** Notify coordinators when new inquiry is created for their program

## Support

For questions or issues, refer to:
- Main documentation: `README.md`
- Inquiry system guide: `REQUEST_INQUIRY_SETUP.md`
- API documentation: `TECHNICAL_DOCS.md`
