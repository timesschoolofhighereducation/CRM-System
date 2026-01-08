# Kanban Status Automation - Testing Guide

## Quick Test Scenarios

### Test 1: Create Inquiry with PENDING Status (Active)

**Steps:**
1. Go to Inquiries page
2. Click "New Inquiry"
3. Fill form with basic info
4. Leave status as default or select "PENDING"
5. Submit

**Expected Results:**
- ✅ Inquiry created successfully
- ✅ 2 follow-up tasks created (3 days, 7 days)
- ✅ Inquiry row shows **GRAY** color (PENDING)
- ✅ Tasks appear in Kanban board "Open" column
- ✅ Tasks are **DRAGGABLE** in Kanban
- ✅ Can manually create new tasks for this inquiry

---

### Test 2: Mark Inquiry as REGISTERED (Final Status - Green)

**Steps:**
1. Find an inquiry with open tasks
2. Edit the inquiry
3. Change status to "REGISTERED"
4. Save

**Expected Results:**
- ✅ Status changed to REGISTERED
- ✅ **ALL open tasks automatically completed**
- ✅ Inquiry row shows **GREEN** color
- ✅ Tasks moved to Kanban "Completed" column
- ✅ Tasks become **READ-ONLY** (cannot drag)
- ✅ Tasks show grey background in Kanban
- ✅ Attempting to drag task shows error toast:
  - "Cannot move task - This task is read-only because the seeker status is REGISTERED"
- ✅ **Cannot create new tasks** for this inquiry
- ✅ Attempting to create task shows error:
  - "Cannot create tasks for [Name]. Seeker status is REGISTERED (final status)"

---

### Test 3: Mark Inquiry as NOT INTERESTED (Final Status - Red)

**Steps:**
1. Find an inquiry with open tasks
2. Edit the inquiry
3. Change status to "NOT_INTERESTED" or "LOST"
4. Optionally add rejection reason
5. Save

**Expected Results:**
- ✅ Status changed to NOT_INTERESTED
- ✅ **ALL open tasks automatically completed**
- ✅ Inquiry row shows **RED** color
- ✅ Tasks moved to Kanban "Completed" column
- ✅ Tasks become **READ-ONLY** (cannot drag)
- ✅ Task history includes rejection reason if provided
- ✅ **Cannot create new tasks** for this inquiry
- ✅ Drag attempt shows error toast

---

### Test 4: Use "Register Now" Toggle in Kanban

**Steps:**
1. Go to Tasks > Kanban Board
2. Find a follow-up task card
3. Click the register checkbox/toggle
4. Confirm action

**Expected Results:**
- ✅ Seeker status set to REGISTERED
- ✅ **ALL tasks for this seeker** automatically completed
- ✅ Success toast: "Seeker Registered! All tasks for [Name] have been automatically completed"
- ✅ All task cards for this seeker move to "Completed" column
- ✅ All cards become read-only
- ✅ Inquiry row turns GREEN

---

### Test 5: Create Inquiry Already Registered (via registerNow flag)

**Steps:**
1. Go to Inquiries page
2. Click "New Inquiry"
3. Fill form
4. Check "Register Now" checkbox
5. Submit

**Expected Results:**
- ✅ Inquiry created with status REGISTERED
- ✅ **NO follow-up tasks created** (final status)
- ✅ Inquiry row shows **GREEN**
- ✅ No tasks appear in Kanban
- ✅ Cannot create tasks for this inquiry

---

### Test 6: Task Creation Guard (Block for Final Status)

**Steps:**
1. Find an inquiry with REGISTERED status
2. Open inquiry details
3. Try to create a new task
4. Submit task form

**Expected Results:**
- ✅ Task creation **REJECTED**
- ✅ Error message displayed:
  - "Cannot create tasks for [Name]. Seeker status is REGISTERED (final status). Tasks can only be created for seekers with PENDING or IN_PROGRESS status."
- ✅ No task created
- ✅ Form can be closed

---

### Test 7: Kanban Drag Protection (Final Status)

**Steps:**
1. Go to Tasks > Kanban Board
2. Find a task for a REGISTERED/NOT_INTERESTED seeker
3. Try to drag the card to another column

**Expected Results:**
- ✅ Card has `cursor-not-allowed` styling
- ✅ Card is dimmed (opacity-60, grey background)
- ✅ Drag attempt is **BLOCKED**
- ✅ Error toast appears:
  - "Cannot move task - This task is read-only because the seeker status is [STATUS]. Tasks are automatically managed based on seeker status."
- ✅ Card stays in current column

---

### Test 8: Status Change from Active to Final

**Steps:**
1. Create inquiry with PENDING status
2. Create 3 manual tasks for it
3. Move 1 task to IN_PROGRESS in Kanban
4. Edit inquiry and change status to COMPLETED
5. Save

**Expected Results:**
- ✅ Status changes to COMPLETED
- ✅ **ALL 3 tasks** (including IN_PROGRESS one) auto-completed
- ✅ Task history shows automated completion:
  - "Task automatically completed - Process completed"
- ✅ Inquiry row turns **BLUE**
- ✅ All tasks in Kanban "Completed" column
- ✅ All tasks read-only

---

### Test 9: Legacy Status Mapping

**Steps:**
1. Edit inquiry via API or form
2. Set status to legacy value (e.g., "LOST")
3. Save

**Expected Results:**
- ✅ Status normalized to NOT_INTERESTED
- ✅ Tasks auto-completed
- ✅ UI shows **RED** color
- ✅ Behavior same as NOT_INTERESTED

**Legacy Mappings to Test:**
- NEW → PENDING (grey, can create tasks)
- ATTEMPTING_CONTACT → IN_PROGRESS (yellow, can create tasks)
- CONNECTED → IN_PROGRESS
- QUALIFIED → IN_PROGRESS
- LOST → NOT_INTERESTED (red, final status)

---

### Test 10: Task History Audit Trail

**Steps:**
1. Create inquiry with 2 tasks
2. Change status to REGISTERED
3. View task action history

**Expected Results:**
- ✅ History entry created for each task
- ✅ Shows: `fromStatus: "OPEN"`, `toStatus: "COMPLETED"`
- ✅ Shows user who made the change
- ✅ Shows timestamp
- ✅ Shows note: "Task automatically completed - Seeker registered successfully"
- ✅ No tasks deleted (data integrity)

---

## Color Reference

| Status | Row Color | Indicator | Behavior |
|--------|-----------|-----------|----------|
| PENDING | Grey | Grey | Can create tasks, tasks draggable |
| IN_PROGRESS | Yellow | Yellow | Can create tasks, tasks draggable |
| REGISTERED | **GREEN** | **Green** | **Cannot create tasks, read-only** |
| NOT_INTERESTED | **RED** | **Red** | **Cannot create tasks, read-only** |
| COMPLETED | **BLUE** | Blue | Cannot create tasks, read-only |

---

## Error Messages to Verify

### Task Creation Blocked
```
Cannot create tasks for John Doe. Seeker status is REGISTERED (final status). 
Tasks can only be created for seekers with PENDING or IN_PROGRESS status.
```

### Kanban Drag Blocked
```
Cannot move task - This task is read-only because the seeker status is REGISTERED. 
Tasks are automatically managed based on seeker status.
```

### Success Messages
```
Seeker Registered! All tasks for John Doe have been automatically completed. 
Status set to REGISTERED.
```

```
Status changed to REGISTERED, 5 task(s) auto-completed
```

---

## API Testing (Optional)

### Test Final Status Task Completion

```bash
# Create inquiry with tasks
POST /api/inquiries
{
  "fullName": "Test User",
  "phone": "1234567890",
  "stage": "PENDING"
}

# Update to REGISTERED
PUT /api/inquiries/{id}
{
  "stage": "REGISTERED"
}

# Verify tasks completed
GET /api/inquiries/{id}/tasks
# Should return all tasks with status: "COMPLETED"
```

### Test Task Creation Guard

```bash
# Try to create task for registered seeker
POST /api/inquiries/{id}/tasks
{
  "purpose": "CALLBACK",
  "notes": "Follow up"
}

# Should return 400 error with message
```

---

## Browser Testing

### Desktop
- ✅ Chrome
- ✅ Firefox
- ✅ Safari
- ✅ Edge

### Mobile
- ✅ iOS Safari
- ✅ Android Chrome

---

## Performance Testing

1. Create 50 inquiries with 5 tasks each (250 tasks total)
2. Mark 10 inquiries as REGISTERED simultaneously
3. Verify all 50 tasks auto-complete within 2 seconds
4. Check Kanban board refreshes properly
5. Ensure no race conditions or partial updates

---

## Edge Cases

### Edge Case 1: Concurrent Status Changes
- User A: Sets inquiry to REGISTERED
- User B: Simultaneously tries to create task
- **Expected**: Task creation should fail (status already changed)

### Edge Case 2: Partial Task Completion
- Inquiry has 10 tasks
- 5 already completed manually
- Status set to REGISTERED
- **Expected**: Only 5 remaining tasks auto-completed

### Edge Case 3: No Tasks
- Inquiry has no tasks
- Status set to REGISTERED
- **Expected**: Status changes, no errors, 0 tasks completed

### Edge Case 4: Transaction Failure
- Database connection lost during status change
- **Expected**: Rollback - no tasks completed, status not changed

---

## Regression Testing

Ensure these existing features still work:

- ✅ Manual task creation for active inquiries
- ✅ Manual task status changes for active inquiries
- ✅ Kanban drag and drop for active inquiries
- ✅ Task filtering and search
- ✅ Inquiry filtering and search
- ✅ User permissions and RBAC
- ✅ Export inquiries to Excel/CSV
- ✅ Campaign tracking
- ✅ Notifications

---

## Cleanup After Testing

1. Delete test inquiries via Trash page
2. Or keep for demo purposes (clearly labeled)
3. Verify audit logs show all test actions

---

## Success Criteria

All tests pass ✅ = Production Ready!

**Minimum Requirements:**
- 8/10 main scenarios pass
- All 3 color codes correct
- Task creation guard works
- Kanban drag protection works
- No data loss or corruption
- No console errors

---

**Last Updated**: January 8, 2026
**Test Version**: 1.0.0

