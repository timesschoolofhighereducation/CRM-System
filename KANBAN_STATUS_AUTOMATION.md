# Kanban-Based Task Automation System

## Overview
This document describes the professional Kanban-based task automation system with seeker status as the single source of truth.

## Architecture

### 1. Seeker Status (Single Source of Truth)

All task automation, Kanban behavior, and UI styling is driven by the seeker's status field.

#### Status Types

**Active Statuses** (Tasks can be created):
- `PENDING` - Initial state, waiting for first contact
- `IN_PROGRESS` - Actively being worked on

**Final Statuses** (Auto-complete tasks, block new tasks):
- `REGISTERED` - Successfully registered (GREEN in UI)
- `NOT_INTERESTED` - Not interested/Lost (RED in UI)
- `COMPLETED` - Process completed (BLUE in UI)

**Legacy Statuses** (Backward compatibility):
- `NEW` → Maps to `PENDING`
- `ATTEMPTING_CONTACT` → Maps to `IN_PROGRESS`
- `CONNECTED` → Maps to `IN_PROGRESS`
- `QUALIFIED` → Maps to `IN_PROGRESS`
- `COUNSELING_SCHEDULED` → Maps to `IN_PROGRESS`
- `CONSIDERING` → Maps to `IN_PROGRESS`
- `READY_TO_REGISTER` → Maps to `IN_PROGRESS`
- `LOST` → Maps to `NOT_INTERESTED`

### 2. Service Layer

**File**: `src/lib/seeker-status-service.ts`

Centralized business logic for status management:

#### Key Functions

- `isFinalStatus(status)` - Check if status blocks task creation
- `canCreateTasks(status)` - Check if tasks can be created
- `normalizeStatus(status)` - Map legacy statuses to new ones
- `handleStatusChange(seekerId, newStatus, userId, oldStatus?, rejectionReason?)` - Auto-complete tasks on final status
- `validateTaskCreation(seekerId)` - Guard for task creation
- `getStatusColor(status)` - UI color classes for status
- `getStatusLabel(status)` - Display label for status

#### Task Automation Flow

When a seeker's status changes to a final status:
1. Service finds all open tasks for the seeker
2. Updates all tasks to `COMPLETED` in a transaction
3. Creates action history entries with appropriate notes
4. Returns summary of actions taken

```typescript
// Example: Seeker marked as REGISTERED
Result: {
  tasksCompleted: 5,
  statusChanged: true,
  message: "Status changed to REGISTERED, 5 task(s) auto-completed"
}
```

### 3. API Endpoints

#### Inquiry Creation (`POST /api/inquiries`)
- Normalizes status (handles `registerNow` flag)
- Creates tasks only if status is active (`PENDING` or `IN_PROGRESS`)
- Auto-completes tasks if status is final
- Uses `handleStatusChange()` for automation

#### Inquiry Update (`PUT /api/inquiries/[id]`)
- Normalizes status
- Detects status changes
- Calls `handleStatusChange()` on transition to final status
- Handles `registerNow` flag for legacy compatibility

#### Task Creation (`POST /api/inquiries/[id]/tasks`)
- **GUARD**: Calls `validateTaskCreation()` before creating
- Rejects task creation if seeker has final status
- Returns 400 error with descriptive message

```typescript
Error: "Cannot create tasks for John Doe. Seeker status is REGISTERED (final status). 
Tasks can only be created for seekers with PENDING or IN_PROGRESS status."
```

### 4. Kanban Board

**File**: `src/components/tasks/kanban-board.tsx`

#### Read-Only Cards
Tasks for seekers with final statuses are:
- Non-draggable (`cursor-not-allowed`)
- Visually dimmed (`opacity-60`, `bg-gray-50`)
- Cannot be manually moved

#### Drag Guard
Before allowing a drag operation:
1. Check if task is for a seeker
2. Normalize seeker's status
3. If status is final (`REGISTERED`, `NOT_INTERESTED`, `COMPLETED`):
   - Block the drag
   - Show error toast
   - Return early

```typescript
toast.error('Cannot move task', {
  description: `This task is read-only because the seeker status is REGISTERED. 
                Tasks are automatically managed based on seeker status.`,
  duration: 5000,
})
```

#### Register Toggle
Updated to use seeker status API:
- Calls `PATCH /api/inquiries/[seekerId]` instead of task endpoint
- Sets status to `REGISTERED` (not just `registerNow` flag)
- Service layer auto-completes all related tasks
- Shows success toast with task completion count

### 5. Inquiry Table UI

**File**: `src/components/inquiries/inquiries-table.tsx`

#### Color-Coded Rows

```typescript
Status → Row Color
-----------------
REGISTERED → Green (bg-green-50 hover:bg-green-100)
NOT_INTERESTED → Red (bg-red-50 hover:bg-red-100)
COMPLETED → Blue (bg-blue-50 hover:bg-blue-100)
IN_PROGRESS → Yellow (hover:bg-yellow-50)
PENDING → Gray (hover:bg-gray-50/30)
```

#### Name Indicator Colors

Left border indicator colors match status:
- `REGISTERED` → Green (`bg-green-500`)
- `NOT_INTERESTED` → Red (`bg-red-500`)
- `COMPLETED` → Blue (`bg-blue-500`)
- `IN_PROGRESS` → Yellow (`bg-yellow-500`)
- `PENDING` → Gray (`bg-gray-400`)

#### Sticky Cell Background
First column (name) background matches row color for visual consistency.

### 6. Data Integrity

#### No Deletions
- Tasks are never deleted, only marked as `COMPLETED`
- Full audit trail via `TaskActionHistory`
- All status changes are logged with:
  - `fromStatus`
  - `toStatus`
  - `actionBy` (user ID)
  - `actionAt` (timestamp)
  - `notes` (descriptive reason)

#### Transaction Safety
Status changes and task completions use Prisma transactions:
```typescript
await prisma.$transaction(async (tx) => {
  // Update all tasks
  await tx.followUpTask.updateMany({ ... })
  // Create history entries
  await tx.taskActionHistory.createMany({ ... })
})
```

#### History Notes
Automatic notes describe why tasks were completed:
- `REGISTERED`: "Task automatically completed - Seeker registered successfully"
- `NOT_INTERESTED`: "Task automatically completed - Seeker not interested: [reason]"
- `COMPLETED`: "Task automatically completed - Process completed"

## Usage Examples

### Example 1: Creating an Inquiry

```typescript
// User creates inquiry with status PENDING
POST /api/inquiries
{
  fullName: "John Doe",
  phone: "1234567890",
  stage: "PENDING" // or omitted, defaults to PENDING
}

Result:
✓ Inquiry created
✓ 2 follow-up tasks created (3 days, 7 days)
✓ UI shows gray row (PENDING)
✓ Tasks are draggable in Kanban
```

### Example 2: Marking as Registered

```typescript
// User updates inquiry to REGISTERED
PUT /api/inquiries/[id]
{
  stage: "REGISTERED"
}

Result:
✓ Status changed to REGISTERED
✓ All open tasks auto-completed (5 tasks)
✓ History created: "Task automatically completed - Seeker registered successfully"
✓ UI shows green row
✓ Kanban cards become read-only (cannot drag)
✓ Future task creation blocked
```

### Example 3: Marking as Not Interested

```typescript
// User updates inquiry to NOT_INTERESTED
PUT /api/inquiries/[id]
{
  stage: "NOT_INTERESTED",
  rejectionReason: "Already enrolled elsewhere"
}

Result:
✓ Status changed to NOT_INTERESTED
✓ All open tasks auto-completed
✓ History: "Task automatically completed - Seeker not interested: Already enrolled elsewhere"
✓ UI shows red row
✓ Tasks read-only in Kanban
✓ Future task creation blocked
```

### Example 4: Attempting to Create Task (Blocked)

```typescript
// User tries to create task for registered seeker
POST /api/inquiries/[id]/tasks
{
  purpose: "CALLBACK",
  notes: "Follow up"
}

Result:
✗ 400 Bad Request
Error: "Cannot create tasks for John Doe. Seeker status is REGISTERED (final status). 
       Tasks can only be created for seekers with PENDING or IN_PROGRESS status."
```

### Example 5: Attempting to Drag Task (Blocked)

```typescript
// User drags a task card in Kanban for registered seeker

Result:
✗ Drag blocked
✗ Toast error: "Cannot move task - This task is read-only because 
               the seeker status is REGISTERED. Tasks are automatically 
               managed based on seeker status."
```

## Testing Checklist

### ✅ Status Normalization
- [ ] Legacy statuses map correctly (NEW → PENDING, LOST → NOT_INTERESTED)
- [ ] `registerNow` flag sets status to REGISTERED

### ✅ Task Automation
- [ ] Tasks auto-complete on REGISTERED
- [ ] Tasks auto-complete on NOT_INTERESTED
- [ ] Tasks auto-complete on COMPLETED
- [ ] History entries created with correct notes
- [ ] Transaction rollback on errors

### ✅ Task Creation Guard
- [ ] Cannot create tasks for REGISTERED seeker
- [ ] Cannot create tasks for NOT_INTERESTED seeker
- [ ] Cannot create tasks for COMPLETED seeker
- [ ] Can create tasks for PENDING seeker
- [ ] Can create tasks for IN_PROGRESS seeker
- [ ] Descriptive error messages

### ✅ Kanban Board
- [ ] Read-only cards for final statuses
- [ ] Cannot drag read-only cards
- [ ] Error toast on attempted drag
- [ ] Normal dragging for active statuses
- [ ] Register toggle updates status and auto-completes tasks

### ✅ Inquiry Table UI
- [ ] GREEN rows for REGISTERED
- [ ] RED rows for NOT_INTERESTED
- [ ] BLUE rows for COMPLETED
- [ ] Correct indicator colors
- [ ] Sticky cell backgrounds match

### ✅ Backward Compatibility
- [ ] Existing inquiries still work
- [ ] Legacy status values handled
- [ ] `registerNow` flag still works
- [ ] No breaking changes to API

## Benefits

1. **Single Source of Truth**: Seeker status drives all behavior
2. **Automatic Task Management**: No manual task completion needed
3. **Consistent UI**: Color coding across all views
4. **Data Integrity**: Transactions, history, no deletions
5. **User-Friendly**: Clear error messages, visual feedback
6. **Scalable**: Service layer can be extended for new rules
7. **Professional**: Production-ready with proper error handling
8. **Auditable**: Complete history of all status changes

## Future Enhancements

1. **Status Workflow**: Define allowed transitions (e.g., PENDING → IN_PROGRESS → REGISTERED)
2. **Role-Based Status**: Limit who can set certain statuses
3. **Bulk Status Updates**: Update multiple inquiries at once
4. **Status Reports**: Analytics on conversion rates by status
5. **Notifications**: Alert users when tasks are auto-completed
6. **Custom Statuses**: Allow organizations to define custom statuses
7. **Status Webhooks**: Trigger external actions on status changes

## Notes

- Service layer is the ONLY place for status business logic
- UI components use the service for consistency
- All status checks use `normalizeStatus()` for legacy compatibility
- Database migrations handled via Prisma schema updates
- No client-side status validation (server-side only)

---

**Last Updated**: January 8, 2026
**Version**: 1.0.0
**Status**: ✅ Production Ready

